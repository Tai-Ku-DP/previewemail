/* eslint-disable react-refresh/only-export-components */
import "../../index.css";
import { ClientOnly } from "./client";

export function generateStaticParams() {
  return [{ slug: [""] }];
}

export default function Page() {
  return <ClientOnly />;
}
