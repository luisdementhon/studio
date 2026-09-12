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
step "1/5  Outils"

if ! command -v firebase >/dev/null 2>&1; then
  warn "Firebase CLI absent, installation..."
  npm install -g firebase-tools
fi
ok "Firebase CLI présent"

if ! firebase projects:list >/dev/null 2>&1; then
  warn "Connexion Google requise, une fenêtre va s'ouvrir."
  firebase login
fi
ok "Authentifié"

# --- Secrets --------------------------------------------------------------
step "2/5  Secrets"

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
  if firebase apphosting:secrets:describe "$name" --project "$PROJECT_ID" >/dev/null 2>&1; then
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
  printf '%s' "$value" | firebase apphosting:secrets:set "$name" \
    --project "$PROJECT_ID" --data-file - --force >/dev/null
  ok "$name enregistré"
}

# Généré localement : aucune raison de vous le faire saisir.
CRON_SECRET_VALUE="$(openssl rand -hex 32)"
if firebase apphosting:secrets:describe CRON_SECRET --project "$PROJECT_ID" >/dev/null 2>&1; then
  ok "CRON_SECRET existe déjà (ignoré)"
else
  printf '%s' "$CRON_SECRET_VALUE" | firebase apphosting:secrets:set CRON_SECRET \
    --project "$PROJECT_ID" --data-file - --force >/dev/null
  ok "CRON_SECRET généré et enregistré"
fi

set_secret STRIPE_SECRET_KEY      "Clé secrète Stripe (Dashboard Stripe > Développeurs > Clés API, sk_...)"
set_secret STRIPE_WEBHOOK_SECRET  "Secret de signature du webhook Stripe (whsec_...)"
set_secret BRIDGE_CLIENT_SECRET   "Client secret Bridge (à régénérer : l'ancien est dans l'historique git)"
set_secret BRIDGE_WEBHOOK_SECRET  "Secret de signature du webhook Bridge"
set_secret RESEND_API_KEY         "Clé API Resend (re_...) — laisser vide pour désactiver les emails"

restore_yaml
trap - EXIT
ok "apphosting.yaml préservé (pas de variables en double)"

# --- Firestore ------------------------------------------------------------
step "3/5  Règles et index Firestore"
firebase deploy --only firestore --project "$PROJECT_ID" --non-interactive
ok "Règles et index déployés"

# --- Jobs planifiés -------------------------------------------------------
step "4/5  Jobs planifiés"

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
step "5/5  Environnement local"

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
echo "  Déployez avec : firebase deploy --project $PROJECT_ID"
echo
echo "  Il reste à faire, hors de portée de ce script :"
echo "   • Créer le webhook Stripe vers https://dotly-app.fr/api/stripe/webhook"
echo "     (événements : payment_intent.succeeded, payment_intent.payment_failed,"
echo "      setup_intent.succeeded, charge.refunded)"
echo "   • Créer le webhook Bridge vers https://dotly-app.fr/api/bridge/webhook"
echo "   • Vérifier le domaine dotly-app.fr chez Resend, si vous activez les emails"
