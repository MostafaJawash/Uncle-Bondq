const SITE_URL = 'https://uncle-bondq.vercel.app'
const BRAND_NAME = 'Uncle Bondq'
const BRAND_NAME_AR = 'انكل بوندق'
const DEFAULT_TITLE = `${BRAND_NAME} | ${BRAND_NAME_AR}`
const DEFAULT_DESCRIPTION = `${BRAND_NAME} - ${BRAND_NAME_AR} متجر شوكولا وضيافة فاخر للطلبات والهدايا والمناسبات في سوريا.`
const DEFAULT_IMAGE = `${SITE_URL}/default.png`

const routeTitles = {
  '/': DEFAULT_TITLE,
  '/types': `${BRAND_NAME} Product Types | أنواع منتجات ${BRAND_NAME_AR}`,
  '/sections': `${BRAND_NAME} Sections | أقسام ${BRAND_NAME_AR}`,
  '/products': `${BRAND_NAME} Products | منتجات ${BRAND_NAME_AR}`,
  '/cart': `${BRAND_NAME} Cart | سلة ${BRAND_NAME_AR}`,
  '/checkout': `${BRAND_NAME} Checkout | تأكيد طلب ${BRAND_NAME_AR}`,
  '/orders': `${BRAND_NAME} Orders | طلبات ${BRAND_NAME_AR}`,
  '/order-details': `${BRAND_NAME} Order Details | تفاصيل طلب ${BRAND_NAME_AR}`,
  '/favorites': `${BRAND_NAME} Favorites | مفضلة ${BRAND_NAME_AR}`,
  '/profile': `${BRAND_NAME} Profile | ملف ${BRAND_NAME_AR}`,
}

const routeDescriptions = {
  '/': DEFAULT_DESCRIPTION,
  '/types': `استكشف أنواع منتجات ${BRAND_NAME} - ${BRAND_NAME_AR} من الشوكولا والضيافة والهدايا.`,
  '/sections': `تصفح أقسام ${BRAND_NAME} - ${BRAND_NAME_AR} واختر المجموعة المناسبة لطلبك.`,
  '/products': `تسوق منتجات ${BRAND_NAME} - ${BRAND_NAME_AR} للشوكولا والضيافة والهدايا وأضفها إلى السلة.`,
  '/cart': `راجع سلة مشتريات ${BRAND_NAME} - ${BRAND_NAME_AR} قبل تأكيد الطلب.`,
  '/checkout': `أكمل طلبك من ${BRAND_NAME} - ${BRAND_NAME_AR} بسهولة.`,
  '/orders': `تابع طلباتك من ${BRAND_NAME} - ${BRAND_NAME_AR}.`,
  '/order-details': `راجع تفاصيل طلبك من ${BRAND_NAME} - ${BRAND_NAME_AR}.`,
  '/favorites': `احفظ منتجاتك المفضلة من ${BRAND_NAME} - ${BRAND_NAME_AR}.`,
  '/profile': `احفظ بياناتك لتسهيل الطلب من ${BRAND_NAME} - ${BRAND_NAME_AR}.`,
}

const setMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector)

  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value)
  })
}

const setLink = (rel, href) => {
  let element = document.head.querySelector(`link[rel="${rel}"]`)

  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }

  element.setAttribute('href', href)
}

export const updateSeo = (pathname = '/') => {
  const cleanPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '')
  const title = routeTitles[cleanPath] || DEFAULT_TITLE
  const description = routeDescriptions[cleanPath] || DEFAULT_DESCRIPTION
  const canonicalUrl = `${SITE_URL}${cleanPath === '/' ? '/' : cleanPath}`

  document.title = title
  setLink('canonical', canonicalUrl)
  setMeta('meta[name="description"]', { name: 'description', content: description })
  setMeta('meta[name="robots"]', {
    name: 'robots',
    content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  })
  setMeta('meta[property="og:title"]', { property: 'og:title', content: title })
  setMeta('meta[property="og:description"]', { property: 'og:description', content: description })
  setMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl })
  setMeta('meta[property="og:image"]', { property: 'og:image', content: DEFAULT_IMAGE })
  setMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: DEFAULT_TITLE })
  setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: title })
  setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description })
  setMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: DEFAULT_IMAGE })
}
