import { redirect } from "next/navigation";

/** A página de preços vive na landing (seção #precios). Mantemos a rota para links antigos. */
export default async function PreciosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}#precios`);
}
