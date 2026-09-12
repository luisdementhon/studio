import type { ReactNode } from 'react';

/**
 * Gabarit commun aux documents légaux.
 *
 * Un document juridique doit rester lisible : mesure de ligne contenue,
 * hiérarchie claire, liens visibles. C'est aussi une exigence de l'article 12
 * du RGPD, qui impose une information « concise, transparente, compréhensible
 * et aisément accessible ».
 */
export function LegalPage({
  title,
  updatedAt,
  intro,
  children,
}: {
  title: string;
  updatedAt: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-headline font-extrabold tracking-tight leading-[0.95]">
          {title}
        </h1>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
          Dernière mise à jour : {updatedAt}
        </p>
        {intro && (
          <div className="text-lg font-headline font-light leading-relaxed text-foreground/70">
            {intro}
          </div>
        )}
      </header>

      <div className="space-y-10 [&_a]:text-brand-coral [&_a]:underline [&_a]:underline-offset-2 [&_p]:leading-relaxed [&_p]:text-foreground/75 [&_li]:text-foreground/75 [&_li]:leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-headline font-extrabold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

/** Tableau responsive : les documents légaux en contiennent souvent. */
export function LegalTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-black/[0.06]">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="bg-black/[0.02]">
            {headers.map((header) => (
              <th
                key={header}
                className="px-5 py-4 text-left text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted-foreground/60"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-black/[0.05] align-top">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-5 py-4 text-foreground/75 leading-relaxed">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
