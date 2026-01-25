import { Link } from "react-router-dom";

import type { Breadcrumb } from "./api";

interface BreadcrumbsProps {
  items: Breadcrumb[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="breadcrumbs" aria-label="Folder path">
      <Link to="/dashboard">My files</Link>
      {items.map((item, index) => (
        <span key={item.id}>
          <span aria-hidden="true">/</span>
          {index === items.length - 1 ? (
            <strong>{item.name}</strong>
          ) : (
            <Link to={`/dashboard/folders/${item.id}`}>{item.name}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
