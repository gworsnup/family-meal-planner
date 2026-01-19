import Head from "next/head";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head>
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/app.min.css" />
        <link rel="stylesheet" href="/assets/css/main.css" />
        <link rel="stylesheet" href="/assets/css/remixicon.css" />
        <link rel="stylesheet" href="/assets/css/slick.css" />
        <link rel="stylesheet" href="/assets/css/slick-theme.css" />
      </Head>
      {children}
    </>
  );
}
