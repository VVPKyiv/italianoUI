import type { ReactNode } from "react";

export function PageHeading({ title, description, aside, back }: {
  title: string;
  description?: string;
  aside?: ReactNode;
  back?: ReactNode;
}) {
  return <header className="page-heading">
    <div className="page-heading-copy">
      {back && <div className="page-heading-back">{back}</div>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {aside && <div className="page-heading-aside">{aside}</div>}
  </header>;
}
