export function Analytics() {
  const dataDomain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN
  const scriptSrc = process.env.NEXT_PUBLIC_ANALYTICS_SCRIPT

  if (!dataDomain || !scriptSrc) {
    return null
  }

  return (
    <script
      defer
      data-domain={dataDomain}
      src={scriptSrc}
    />
  )
}
