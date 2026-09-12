#!/usr/bin/env bash
#
# Configuration de production Dotly — à lancer une seule fois.
#
#   bash scripts/setup-production.sh
#
# Ce script fait tout ce qui demande une authentification Google : créer les
# secrets, déployer les règles et index Firestore, planifier les jobs
# mensuels. Il ne stocke aucun secret en clair et ne les affiche jamais.
#
# Les valeurs vous sont demandées une par une, en saisie masquée.

set -euo pipefail

# Mode ciblé : `bash scripts/setup-production.sh BRIDGE_CLIENT_SECRET [...]`
# ne (re)définit que les secrets nommés, en écrasant la valeur existante, et
# s'arrête là. Utile pour corriger une valeur saisie par erreur ou en ajouter
# une plus tard, sans rejouer tout le parcours.
TARGETED="false"
TARGET_SECRETS=("$@")
if [ ${#TARGET_SECRETS[@]} -gt 0 ]; then
  TARGETED="true"
fi

wanted() {
  [ "$TARGETED" = "false" ] && return 0
  local name="$1" target
  for target in "${TARGET_SECRETS[@]}"; do
    [ "$target" = "$name" ] && return 0
  done
  return 1
}

# `.firebaserc` n'a pas d'extension : require() le chargerait comme du
# JavaScript et échouerait. On le lit donc explicitement comme du JSON.
PROJECT_ID="$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('.firebaserc','utf8')).projects.default)" 2>/dev/null || echo '')"
REGION="europe-west1"

bold() { printf "\033[1m%s\033[0m\n" "$1"; }
ok()   { printf "  \033[32m✓\033[0m %s\n" "$1"; }
warn() { printf "  \033[33m!\033[0m %s\n" "$1"; }
step() { printf "\n\033[1m%s\033[0m\n" "$1"; }

if [ -z "$PROJECT_ID" ]; then
  if [ ! -f .firebaserc ]; then
    echo "Fichier .firebaserc introuvable dans $(pwd)."
    echo "Lancez ce script depuis la racine du dépôt."
  else
    echo "Le fichier .firebaserc a été trouvé mais son contenu n'a pas pu être lu."
    echo "Vérifiez qu'il contient bien un JSON valide avec projects.default."
  fi
  exit 1
fi

bold "Configuration de production — projet $PROJECT_ID"

# --- Outils ---------------------------------------------------------------
step "1/6  Outils"

# On évite `npm install -g` : sur macOS, /usr/local/lib/node_modules
# n'appartient pas à l'utilisateur et l'installation échoue en EACCES.
# npx exécute le CLI sans rien installer globalement, donc sans sudo.
if command -v firebase >/dev/null 2>&1; then
  FIREBASE="firebase"
  ok "Firebase CLI présent"
else
  FIREBASE="npx --yes firebase-tools@latest"
  ok "Firebase CLI exécuté via npx (aucune installation globale requise)"
fi

if ! $FIREBASE projects:list >/dev/null 2>&1; then
  warn "Connexion Google requise, une fenêtre va s'ouvrir dans votre navigateur."
  $FIREBASE login
fi
ok "Authentifié"

# --- Secrets --------------------------------------------------------------
step "2/6  Secrets"

# `secrets:set --force` accorde les permissions au compte de service, ce que
# l'on veut, mais ajoute aussi l'entrée dans apphosting.yaml — où elles
# figurent déjà. On conserve donc le fichier et on le restaure ensuite,
# plutôt que de se retrouver avec des variables en double.
YAML_BACKUP="$(mktemp)"
cp apphosting.yaml "$YAML_BACKUP"
restore_yaml() {
  if ! cmp -s apphosting.yaml "$YAML_BACKUP"; then
    cp "$YAML_BACKUP" apphosting.yaml
  fi
  rm -f "$YAML_BACKUP"
}
trap restore_yaml EXIT

# Saisie masquée : la valeur ne s'affiche pas et ne va pas dans l'historique.
set_secret() {
  local name="$1" prompt="$2" value
  # En mode ciblé (noms passés en argument), on remplace même si le secret
  # existe : c'est précisément le cas d'une valeur saisie par erreur.
  if [ "$TARGETED" = "false" ] \
     && $FIREBASE apphosting:secrets:describe "$name" --project "$PROJECT_ID" >/dev/null 2>&1; then
    ok "$name existe déjà (ignoré)"
    return
  fi
  printf "  %s\n  Valeur : " "$prompt"
  read -rs value
  printf "\n"
  if [ -z "$value" ]; then
    warn "$name ignoré (valeur vide) — à créer plus tard"
    return
  fi
  printf '%s' "$value" | $FIREBASE apphosting:secrets:set "$name" \
    --project "$PROJECT_ID" --data-file - --force >/dev/null
  ok "$name enregistré"
}

# Généré localement : aucune raison de vous le faire saisir.
#
# S'il existe déjà, on le RELIT au lieu d'en générer un nouveau : les jobs
# Cloud Scheduler embarquent cette valeur dans leur en-tête Authorization.
# Générer une valeur non enregistrée créerait des jobs dont tous les appels
# seraient rejetés en 401.
if $FIREBASE apphosting:secrets:describe CRON_SECRET --project "$PROJECT_ID" >/dev/null 2>&1; then
  CRON_SECRET_VALUE="$($FIREBASE apphosting:secrets:access CRON_SECRET --project "$PROJECT_ID" 2>/dev/null | tr -d '\n')"
  if [ -z "$CRON_SECRET_VALUE" ]; then
    warn "CRON_SECRET existe mais n'a pas pu être relu — les jobs planifiés seront ignorés."
  else
    ok "CRON_SECRET existant relu"
  fi
else
  CRON_SECRET_VALUE="$(openssl rand -hex 32)"
  printf '%s' "$CRON_SECRET_VALUE" | $FIREBASE apphosting:secrets:set CRON_SECRET \
    --project "$PROJECT_ID" --data-file - --force >/dev/null
  ok "CRON_SECRET généré et enregistré"
fi

wanted STRIPE_SECRET_KEY     && set_secret STRIPE_SECRET_KEY     "Clé secrète Stripe (Dashboard Stripe > Développeurs > Clés API, sk_...)"
wanted STRIPE_WEBHOOK_SECRET && set_secret STRIPE_WEBHOOK_SECRET "Secret de signature du webhook Stripe (whsec_...)"
wanted BRIDGE_CLIENT_SECRET  && set_secret BRIDGE_CLIENT_SECRET  "Client secret Bridge — celui de l'APPLICATION (Configuration > Paramètres), PAS celui du webhook"
wanted BRIDGE_WEBHOOK_SECRET && set_secret BRIDGE_WEBHOOK_SECRET "Secret de signature du WEBHOOK Bridge"
wanted RESEND_API_KEY        && set_secret RESEND_API_KEY        "Clé API Resend (re_...) — laisser vide pour désactiver les emails"

restore_yaml
trap - EXIT
ok "apphosting.yaml préservé (pas de variables en double)"

if [ "$TARGETED" = "true" ]; then
  step "Terminé"
  echo "  Secret(s) mis à jour. Redéployez pour que la nouvelle valeur soit prise en compte :"
  echo "    $FIREBASE deploy --project $PROJECT_ID"
  exit 0
fi

# --- Cohérence de apphosting.yaml -----------------------------------------
# Une référence `secret:` vers un secret absent de Secret Manager fait
# échouer l'intégralité du déploiement, avec un message qui ne désigne pas
# le secret fautif. On vérifie donc avant, pendant qu'on peut nommer
# précisément le problème.
step "3/6  Cohérence de apphosting.yaml"

MISSING_SECRETS=""
while IFS= read -r name; do
  [ -z "$name" ] && continue
  if ! $FIREBASE apphosting:secrets:describe "$name" --project "$PROJECT_ID" >/dev/null 2>&1; then
    MISSING_SECRETS="$MISSING_SECRETS $name"
  fi
done < <(grep -E '^[[:space:]]*secret:' apphosting.yaml | sed -E 's/.*secret:[[:space:]]*//' | tr -d '"')

if [ -n "$MISSING_SECRETS" ]; then
  warn "apphosting.yaml référence des secrets inexistants :$MISSING_SECRETS"
  warn "Le déploiement échouerait. Créez-les, ou commentez la référence dans apphosting.yaml :"
  for missing in $MISSING_SECRETS; do
    warn "    bash scripts/setup-production.sh $missing"
  done
  exit 1
fi
ok "Tous les secrets référencés existent"

# --- Firestore ------------------------------------------------------------
step "4/6  Règles et index Firestore"
$FIREBASE deploy --only firestore --project "$PROJECT_ID" --non-interactive
ok "Règles et index déployés"

# --- Jobs planifiés -------------------------------------------------------
step "5/6  Jobs planifiés"

if ! command -v gcloud >/dev/null 2>&1; then
  warn "gcloud absent : les jobs planifiés doivent être créés à la main."
  warn "Installez le SDK (https://cloud.google.com/sdk) puis relancez ce script."
else
  gcloud services enable cloudscheduler.googleapis.com --project "$PROJECT_ID" --quiet
  APP_URL="https://dotly-app.fr"

  create_job() {
    local name="$1" schedule="$2" path="$3" description="$4"
    if gcloud scheduler jobs describe "$name" --location "$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
      ok "$name existe déjà (ignoré)"
      return
    fi
    gcloud scheduler jobs create http "$name" \
      --location "$REGION" --project "$PROJECT_ID" \
      --schedule "$schedule" --time-zone "Europe/Paris" \
      --uri "${APP_URL}${path}" --http-method POST \
      --headers "Authorization=Bearer ${CRON_SECRET_VALUE}" \
      --description "$description" \
      --attempt-deadline 300s --quiet >/dev/null
    ok "$name créé ($schedule)"
  }

  # Le 3 du mois : les banques ont 1 à 2 jours de retard sur les opérations,
  # on laisse le mois se terminer vraiment avant de prélever.
  create_job dotly-reglement-mensuel "0 9 3 * *" \
    "/api/cron/monthly-settlement" "Prélèvement mensuel des arrondis Dotly"

  # Mi-janvier : l'année civile précédente est close.
  create_job dotly-recus-fiscaux "0 9 15 1 *" \
    "/api/cron/annual-tax-receipts" "Génération des reçus fiscaux annuels Dotly"
fi

# --- Environnement local --------------------------------------------------
step "6/6  Environnement local"

if [ -f .env.local ]; then
  if ! grep -q "^CRON_SECRET=" .env.local; then
    printf '\nCRON_SECRET=%s\n' "$CRON_SECRET_VALUE" >> .env.local
    ok "CRON_SECRET ajouté à .env.local"
  else
    ok ".env.local déjà configuré"
  fi
else
  warn ".env.local absent — copiez .env.example et renseignez-le pour le dev local"
fi

step "Terminé"
echo "  Déployez avec : $FIREBASE deploy --project $PROJECT_ID"
echo
echo "  Il reste à faire, hors de portée de ce script :"
echo "   • Créer le webhook Stripe vers https://dotly-app.fr/api/stripe/webhook"
echo "     (événements : payment_intent.succeeded, payment_intent.payment_failed,"
echo "      setup_intent.succeeded, charge.refunded)"
echo "   • Créer le webhook Bridge vers https://dotly-app.fr/api/bridge/webhook"
echo "   • Vérifier le domaine dotly-app.fr chez Resend, si vous activez les emails"
