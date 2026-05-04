import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa'
import BottomNav from './components/BottomNav'
import BackButton from './components/BackButton'
import ProductModal from './components/ProductModal'
import CartPage from './pages/CartPage'
import CategoriesPage from './pages/CategoriesPage'
import CheckoutPage from './pages/CheckoutPage'
import OrdersPage from './pages/OrdersPage'
import ProductTypesPage from './pages/ProductTypesPage'
import ProductsPage from './pages/ProductsPage'
import SectionsPage from './pages/SectionsPage'
import SuccessPage from './pages/SuccessPage'
import ProfilePage from './pages/ProfilePage'
import FavoritesPage from './pages/FavoritesPage'
import OrderDetailsPage from './pages/OrderDetailsPage'
import { getInitialLanguage, LANGUAGE_STORAGE_KEY, translate } from './i18n'
import { isSupabaseConfigured, supabase, syncUserProfile } from './lib/supabase'
import { getPriceAmount, getProductImages } from './utils/store'

const CART_STORAGE_KEY = 'uncle-bondq-cart'
const USER_ID_STORAGE_KEY = 'uncle-bondq-user-id'
const PHONE_STORAGE_KEY = 'uncle-bondq-phone'
const FULL_NAME_STORAGE_KEY = 'uncle-bondq-full-name'
const FAVORITES_STORAGE_KEY = 'uncle-bondq-favorites'
const COUPON_STORAGE_KEY = 'uncle-bondq-coupon'
const initialCheckout = { full_name: '', phone: '', address: '', notes: '' }

const demoCategories = [
  { id: 'demo-cat-1', name: 'شوكولا', image_url: null },
  { id: 'demo-cat-2', name: 'ضيافة', image_url: null },
]

const demoTypes = [
  { id: 'demo-type-1', name: 'علب شوكولا', category_id: 'demo-cat-1', image_url: null },
  { id: 'demo-type-2', name: 'هدايا وضيافة', category_id: 'demo-cat-2', image_url: null },
]

const demoSections = [
  { id: 'demo-section-1', name: 'فاخر', type_id: 'demo-type-1', category_id: 'demo-cat-1', image_url: null },
  { id: 'demo-section-2', name: 'كلاسيك', type_id: 'demo-type-2', category_id: 'demo-cat-2', image_url: null },
]

const demoProducts = [
  {
    id: 'demo-product-1',
    name: 'علبة بندق فاخرة',
    price: 150000,
    description: 'تشكيلة شوكولا بالحشوات الغنية.',
    weight: '500 غ',
    category_id: 'demo-cat-1',
    type_id: 'demo-type-1',
    section_id: 'demo-section-1',
  },
  {
    id: 'demo-product-2',
    name: 'ضيافة Uncle Bondq',
    price: 225000,
    description: 'قطع مرتبة للمناسبات والزيارات.',
    weight: '750 غ',
    category_id: 'demo-cat-2',
    type_id: 'demo-type-2',
    section_id: 'demo-section-2',
  },
]

const productColumns = 'id, name, price, description, weight, images, category_id, type_id, section_id'
const orderColumns =
  'id, user_id, customer_name, phone, address, notes, status, total_amount, discount_amount, final_amount, created_at, order_items(id, order_id, product_id, product_name, quantity, unit_price, total_price)'

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '')

const getRoute = () => {
  const pathname = window.location.pathname.replace(basePath, '') || '/'
  return {
    pathname: pathname === '' ? '/' : pathname,
    search: new URLSearchParams(window.location.search),
  }
}

const getInitialRoute = () => {
  const redirect = new URLSearchParams(window.location.search).get('redirect')
  if (redirect) window.history.replaceState({}, '', makeUrl(redirect))

  return getRoute()
}

const makeUrl = (path, params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value)
  })

  return `${basePath}${path}${query.toString() ? `?${query}` : ''}`
}

const ensureUserId = () => {
  const existingUserId = localStorage.getItem(USER_ID_STORAGE_KEY)
  if (existingUserId) return existingUserId

  const userId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  localStorage.setItem(USER_ID_STORAGE_KEY, userId)

  return userId
}

const getFavoritesKey = (phone) => `${FAVORITES_STORAGE_KEY}-${phone || 'guest'}`

const getStoredFavorites = (phone) => {
  try {
    return JSON.parse(localStorage.getItem(getFavoritesKey(phone)) || '[]')
  } catch {
    return []
  }
}

const getCouponDiscount = (code, total) => {
  const normalizedCode = code.trim().toUpperCase()
  if (normalizedCode === 'BONDQ10') return Math.round(total * 0.1)
  if (normalizedCode === 'SAVE5') return Math.round(total * 0.05)
  return 0
}

const getStoredProfile = () => ({
  full_name: localStorage.getItem(FULL_NAME_STORAGE_KEY) || '',
  phone: localStorage.getItem(PHONE_STORAGE_KEY) || '',
})

function App() {
  const [language, setLanguage] = useState(getInitialLanguage)
  const [route, setRoute] = useState(getInitialRoute)
  const [categories, setCategories] = useState([])
  const [productTypes, setProductTypes] = useState([])
  const [sections, setSections] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [modalQuantity, setModalQuantity] = useState(1)
  const [checkout, setCheckout] = useState(() => ({
    ...initialCheckout,
    ...getStoredProfile(),
  }))
  const [successOrder, setSuccessOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(getStoredProfile)
  const loggedPhone = profile.phone
  const [favoriteIds, setFavoriteIds] = useState(() => getStoredFavorites(localStorage.getItem(PHONE_STORAGE_KEY) || ''))
  const [couponCode, setCouponCode] = useState(() => localStorage.getItem(COUPON_STORAGE_KEY) || '')
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  })

  const isArabic = language === 'ar'
  const t = useCallback((key, values) => translate(language, key, values), [language])

  const navigate = useCallback((path, params = {}) => {
    if (path === '/products' && !sessionStorage.getItem('uncle-bondq-products-filtered')) {
      sessionStorage.removeItem('uncle-bondq-category-id')
      sessionStorage.removeItem('uncle-bondq-type-id')
      sessionStorage.removeItem('uncle-bondq-section-id')
    }
    sessionStorage.removeItem('uncle-bondq-products-filtered')
    const url = makeUrl(path, params)
    window.history.pushState({}, '', url)
    setRoute(getRoute())
    setIsDrawerOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const handlePopState = () => setRoute(getRoute())
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    document.documentElement.lang = language
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr'
  }, [isArabic, language])

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    ensureUserId()
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFavoriteIds(getStoredFavorites(loggedPhone))
      if (loggedPhone) {
        setCheckout((value) => ({ ...value, full_name: profile.full_name, phone: loggedPhone }))
      }
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [loggedPhone, profile.full_name])

  useEffect(() => {
    localStorage.setItem(getFavoritesKey(loggedPhone), JSON.stringify(favoriteIds))
  }, [favoriteIds, loggedPhone])

  useEffect(() => {
    localStorage.setItem(COUPON_STORAGE_KEY, couponCode)
  }, [couponCode])

  useEffect(() => {
    async function loadStorefront() {
      if (!isSupabaseConfigured) {
        setCategories(demoCategories)
        setProductTypes(demoTypes)
        setSections(demoSections)
        setProducts(demoProducts)
        setError(t('app.configuredError'))
        setIsLoading(false)
        return
      }

      try {
        const [categoriesResult, typesResult, sectionsResult, productsResult] = await Promise.all([
          supabase.from('categories').select('id, name, image_url').order('name'),
          supabase.from('product_types').select('id, name, category_id, image_url').order('name'),
          supabase
            .from('sections')
            .select(`
              id,
              name,
              image_url,
              category_id,
              type_id,
              categories ( id, name ),
              product_types ( id, name )
            `)
            .order('name'),
          supabase.from('products').select(productColumns),
        ])

        if (categoriesResult.error) throw categoriesResult.error
        if (typesResult.error) throw typesResult.error
        if (sectionsResult.error) throw sectionsResult.error
        if (productsResult.error) throw productsResult.error

        console.log('Sections loaded:', sectionsResult.data?.length || 0)
        if (sectionsResult.data?.length === 0) {
          console.warn('Warning: No sections found in database')
        }

        setCategories(categoriesResult.data || [])
        setProductTypes(typesResult.data || [])
        setSections(sectionsResult.data || [])
        setProducts(productsResult.data || [])
      } catch (requestError) {
        console.error('Storefront load error:', requestError)
        setError(requestError.message || t('app.loadError'))
      } finally {
        setIsLoading(false)
      }
    }

    loadStorefront()
  }, [t])

  const cartCount = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart])
  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + getPriceAmount(item.price) * item.quantity, 0),
    [cart],
  )
  const couponDiscount = useMemo(() => getCouponDiscount(couponCode, cartTotal), [cartTotal, couponCode])
  const discountedTotal = Math.max(0, cartTotal - couponDiscount)

  const categoryId = route.search.get('category_id') || sessionStorage.getItem('uncle-bondq-category-id') || ''
  const typeId = route.search.get('type_id') || sessionStorage.getItem('uncle-bondq-type-id') || ''
  const sectionId = route.search.get('section_id') || sessionStorage.getItem('uncle-bondq-section-id') || ''
  const orderId = route.search.get('id') || sessionStorage.getItem('uncle-bondq-order-id') || ''

  // Debug: Log navigation values when they change
  useEffect(() => {
    console.log('Route changed:', {
      pathname: route.pathname,
      categoryId,
      typeId,
      sectionId,
      sessionStorageCategory: sessionStorage.getItem('uncle-bondq-category-id'),
      sessionStorageType: sessionStorage.getItem('uncle-bondq-type-id'),
      sessionStorageSection: sessionStorage.getItem('uncle-bondq-section-id'),
    })
  }, [route.pathname, categoryId, typeId, sectionId])

  const relatedTypes = useMemo(() => {
    if (!categoryId) return []
    return productTypes.filter((type) => type.category_id === categoryId)
  }, [categoryId, productTypes])

  const relatedSections = useMemo(() => {
    if (!sections || sections.length === 0) {
      console.log('No sections available')
      return []
    }
    
    console.log('Filtering sections:', {
      totalSections: sections.length,
      categoryId,
      typeId,
    })

    let filtered = sections
    if (categoryId) {
      console.log('Filtering by category:', categoryId)
      filtered = filtered.filter((section) => {
        const match = section.category_id === categoryId
        if (!match) {
          console.log('Section filtered out:', { 
            sectionId: section.id, 
            sectionCategoryId: section.category_id, 
            expectedCategoryId: categoryId 
          })
        }
        return match
      })
      console.log('After category filter:', filtered.length)
    }
    
    if (typeId) {
      console.log('Filtering by type:', typeId)
      filtered = filtered.filter((section) => {
        const match = section.type_id === typeId
        if (!match) {
          console.log('Section filtered out by type:', { 
            sectionId: section.id, 
            sectionTypeId: section.type_id, 
            expectedTypeId: typeId 
          })
        }
        return match
      })
      console.log('After type filter:', filtered.length)
    }

    console.log('Final filtered sections:', filtered.length, filtered)
    return filtered
  }, [categoryId, typeId, sections])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryMatches = !categoryId || product.category_id === categoryId
      const typeMatches = !typeId || product.type_id === typeId
      const sectionMatches = !sectionId || product.section_id === sectionId

      return categoryMatches && typeMatches && sectionMatches
    })
  }, [categoryId, products, sectionId, typeId])

  const productTitle = categoryId || typeId || sectionId ? t('products.filteredTitle') : t('products.allTitle')

  const addToCart = useCallback((product, quantity = 1) => {
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id)
      if (existing) {
        return items.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }

      return [
        ...items,
        {
          id: product.id,
          name: product.name,
          price: product.price || 0,
          description: product.description || '',
          weight: product.weight || '',
          image: getProductImages(product)[0] || '',
          quantity,
        },
      ]
    })
  }, [])

  const updateQuantity = (productId, delta) => {
    setCart((items) =>
      items
        .map((item) =>
          item.id === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  const fetchOrders = useCallback(async (phoneOverride = '') => {
    if (!isSupabaseConfigured) return

    setIsOrdersLoading(true)
    setError('')

    try {
      let query = supabase.from('orders').select(orderColumns).order('created_at', { ascending: false })

      const phone = (phoneOverride || loggedPhone).trim()
      if (!phone) {
        setOrders([])
        setIsOrdersLoading(false)
        return
      }
      query = query.eq('phone', phone)

      const { data, error: ordersError } = await query
      if (ordersError) throw ordersError

      setOrders(data || [])
    } catch (requestError) {
      setError(requestError.message || t('app.loadError'))
    } finally {
      setIsOrdersLoading(false)
    }
  }, [loggedPhone, t])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (route.pathname === '/orders' || route.pathname === '/order-details') fetchOrders()
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [fetchOrders, route.pathname])

  const submitOrder = async (event) => {
    event.preventDefault()
    if (!loggedPhone) {
      navigate('/profile', { redirect: '/checkout' })
      return
    }
    if (!cart.length || !isSupabaseConfigured) return

    setIsSubmitting(true)
    setError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const rpcItems = cart.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
      }))

      console.log('Submitting order:', {
        customerId: user?.id ?? '',
        customerName: profile.full_name || checkout.full_name,
        phone: checkout.phone,
        itemCount: rpcItems.length,
        total: discountedTotal,
      })

      const { data: orderData, error: createOrderError } = await supabase.rpc('create_order', {
        p_customer_name: profile.full_name || checkout.full_name,
        p_phone: checkout.phone,
        p_address: checkout.address,
        p_notes: checkout.notes,
        p_customer_id: user?.id ?? '',
        p_coupon_code: couponCode ?? '',
        p_items: rpcItems,
      })

      if (createOrderError) {
        console.error('Order creation error:', createOrderError)
        throw createOrderError
      }

      console.log('Order created successfully:', orderData)

      const createdOrder = orderData
      const createdOrderId = createdOrder?.order_id
      const finalTotal = Number(createdOrder?.final_total ?? discountedTotal)
      const createdAt = new Date().toISOString()

      setSuccessOrder({
        id: createdOrderId || '',
        items: cart,
        total: Number.isFinite(finalTotal) ? finalTotal : discountedTotal,
        status: 'pending',
        created_at: createdAt,
      })

      window.alert(`المبلغ النهائي بعد الخصم: ${(Number.isFinite(finalTotal) ? finalTotal : discountedTotal).toLocaleString('ar-SY')} ل.س`)

      setCart([])
      setCouponCode('')
      setCheckout({ ...initialCheckout, full_name: profile.full_name, phone: loggedPhone })
      await fetchOrders(checkout.phone)

      if (createdOrderId) {
        navigate('/order-details', { id: createdOrderId })
      } else {
        navigate('/orders')
      }
    } catch (submitError) {
      const message = submitError.message || t('app.submitError')
      setError(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProfileSave = async (nextProfile) => {
    const cleanProfile = {
      full_name: nextProfile.full_name.trim(),
      phone: nextProfile.phone.trim(),
    }

    if (!cleanProfile.phone || !cleanProfile.full_name) {
      setError(t('app.profileError'))
      return
    }

    // Sync with Supabase database if configured
    if (isSupabaseConfigured) {
      try {
        const userId = ensureUserId()
        const syncResult = await syncUserProfile(userId, cleanProfile.full_name, cleanProfile.phone)
        if (!syncResult.success) {
          setError(`${t('app.profileError')}: ${syncResult.error}`)
          return
        }
        // Clear error on success
        setError('')
      } catch (syncError) {
        console.error('Profile sync error:', syncError)
        setError(syncError.message || t('app.profileError'))
        return
      }
    }

    // Save to localStorage
    localStorage.setItem(FULL_NAME_STORAGE_KEY, cleanProfile.full_name)
    localStorage.setItem(PHONE_STORAGE_KEY, cleanProfile.phone)
    setProfile(cleanProfile)
    setCheckout((value) => ({ ...value, ...cleanProfile }))
    const redirect = route.search.get('redirect') || '/'
    navigate(redirect)
  }

  const toggleFavorite = (product) => {
    if (!loggedPhone) {
      navigate('/profile', { redirect: route.pathname })
      return
    }

    setFavoriteIds((ids) =>
      ids.includes(product.id) ? ids.filter((id) => id !== product.id) : [...ids, product.id],
    )
  }

  const navigateBack = () => {
    if (window.history.length > 1) {
      window.history.back()
      return
    }
    navigate('/')
  }

  const showBackButton = ['/types', '/sections', '/products', '/order-details'].includes(route.pathname)

  const navItems = [
    { path: '/', label: t('nav.home'), active: route.pathname === '/' },
    { path: '/cart', label: `${t('nav.cart')} (${cartCount})`, active: route.pathname === '/cart' },
    { path: '/orders', label: t('nav.orders'), active: route.pathname === '/orders' },
    { path: '/favorites', label: t('nav.favorites'), active: route.pathname === '/favorites' },
    { path: '/products', label: t('nav.products'), active: route.pathname === '/products' },
    { path: '/profile', label: profile.full_name || t('profile.title'), active: route.pathname === '/profile' },
  ]

  const renderPage = () => {
    if (route.pathname === '/') {
      return (
        <CategoriesPage
          categories={categories}
          isLoading={isLoading}
          t={t}
          onSelect={(category) => {
            console.log('Selected category:', category)
            sessionStorage.setItem('uncle-bondq-category-id', category.id)
            sessionStorage.removeItem('uncle-bondq-type-id')
            sessionStorage.removeItem('uncle-bondq-section-id')
            navigate('/types')
          }}
        />
      )
    }

    if (route.pathname === '/types') {
      return (
        <ProductTypesPage
          productTypes={relatedTypes}
          isLoading={isLoading}
          t={t}
          onSelect={(type) => {
            console.log('Selected type:', type)
            console.log('Current categoryId:', categoryId)
            sessionStorage.setItem('uncle-bondq-category-id', categoryId)
            sessionStorage.setItem('uncle-bondq-type-id', type.id)
            sessionStorage.removeItem('uncle-bondq-section-id')
            console.log('About to navigate to /sections with:', {
              categoryId,
              typeId: type.id,
            })
            navigate('/sections')
          }}
        />
      )
    }

    if (route.pathname === '/sections') {
      console.log('Sections page - current state:', {
        categoryId,
        typeId,
        relatedSectionsCount: relatedSections.length,
      })
      return (
        <SectionsPage
          sections={relatedSections}
          isLoading={isLoading}
          t={t}
          onSelect={(section) => {
            console.log('Selected section:', section)
            sessionStorage.setItem('uncle-bondq-section-id', section.id)
            sessionStorage.setItem('uncle-bondq-products-filtered', '1')
            navigate('/products')
          }}
        />
      )
    }

    if (route.pathname === '/products') {
      return (
        <ProductsPage
          title={productTitle}
          products={filteredProducts}
          isLoading={isLoading}
          cartCount={cartCount}
          favoriteIds={favoriteIds}
          onOpenProduct={(product) => {
            setModalQuantity(1)
            setSelectedProduct(product)
          }}
          onAddToCart={addToCart}
          onToggleFavorite={toggleFavorite}
          onViewCart={() => navigate('/cart')}
          t={t}
        />
      )
    }

    if (route.pathname === '/cart') {
      return (
        <CartPage
          cart={cart}
          t={t}
          cartTotal={cartTotal}
          couponCode={couponCode}
          couponDiscount={couponDiscount}
          discountedTotal={discountedTotal}
          onCouponChange={setCouponCode}
          onDecrease={(id) => updateQuantity(id, -1)}
          onIncrease={(id) => updateQuantity(id, 1)}
          onRemove={(id) => setCart((items) => items.filter((item) => item.id !== id))}
          onCheckout={() => navigate('/checkout')}
          onContinue={() => navigate('/')}
        />
      )
    }

    if (route.pathname === '/checkout') {
      return (
        <CheckoutPage
          checkout={checkout}
          t={t}
          setCheckout={setCheckout}
          cart={cart}
          cartTotal={discountedTotal}
          couponCode={couponCode}
          couponDiscount={couponDiscount}
          onCouponChange={setCouponCode}
          isSubmitting={isSubmitting}
          onSubmit={submitOrder}
        />
      )
    }

    if (route.pathname === '/orders') {
      return (
        <OrdersPage
          orders={orders}
          isLoading={isOrdersLoading}
          language={language}
          onRefresh={() => fetchOrders()}
          isLoggedIn={Boolean(loggedPhone)}
          onProfile={() => navigate('/profile', { redirect: '/orders' })}
          onOpenOrder={(id) => {
            sessionStorage.setItem('uncle-bondq-order-id', id)
            navigate('/order-details')
          }}
          t={t}
        />
      )
    }

    if (route.pathname === '/order-details') {
      return (
        <OrderDetailsPage
          order={orders.find((order) => order.id === orderId)}
          isLoading={isOrdersLoading}
          language={language}
          onRefresh={() => fetchOrders()}
          t={t}
        />
      )
    }

    if (route.pathname === '/favorites') {
      const favoriteProducts = products.filter((product) => favoriteIds.includes(product.id))

      return (
        <FavoritesPage
          products={favoriteProducts}
          favoriteIds={favoriteIds}
          isLoggedIn={Boolean(loggedPhone)}
          onLogin={() => navigate('/profile', { redirect: '/favorites' })}
          onOpenProduct={(product) => {
            setModalQuantity(1)
            setSelectedProduct(product)
          }}
          onAddToCart={addToCart}
          onToggleFavorite={toggleFavorite}
          t={t}
        />
      )
    }

    if (route.pathname === '/profile') {
      return <ProfilePage initialProfile={profile} onSubmit={handleProfileSave} t={t} error={error} />
    }

    return (
      <SuccessPage
        order={successOrder || { id: '', items: [], total: 0 }}
        t={t}
        onHome={() => navigate('/')}
      />
    )
  }

  return (
    <main className="app-layout" data-language={language}>
      <aside className="sidebar">
        <button className="brand-link" type="button" onClick={() => navigate('/')}>
          <img src={`${basePath}/favicon.png`} alt="" />
          <span>{t('app.brand')}</span>
        </button>
        <nav>
          {navItems.map((item) => (
            <button
              className={item.active ? 'is-active' : ''}
              type="button"
              key={item.path}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button className="language-link" type="button" onClick={() => setLanguage((current) => (current === 'ar' ? 'en' : 'ar'))}>
          {isArabic ? t('app.languageEnglish') : t('app.languageArabic')}
        </button>
        {loggedPhone && (
          <button className="language-link" type="button" onClick={() => handleProfileSave({ full_name: '', phone: '' })}>
            {t('profile.logout')}
          </button>
        )}
      </aside>

      <header className="mobile-header">
        <button className="drawer-toggle" type="button" onClick={() => setIsDrawerOpen(true)} aria-label={t('app.menu')}>
          ☰
        </button>
        <button className="brand-link" type="button" onClick={() => navigate('/')}>
          <img src={`${basePath}/favicon.png`} alt="" />
          <span>{t('app.brand')}</span>
        </button>
      </header>

      {isDrawerOpen && (
        <div className="drawer-layer" onClick={() => setIsDrawerOpen(false)}>
          <aside className="mobile-drawer" onClick={(event) => event.stopPropagation()}>
            <button className="brand-link" type="button" onClick={() => navigate('/')}>
              <img src={`${basePath}/favicon.png`} alt="" />
              <span>{t('app.brand')}</span>
            </button>
            {navItems.map((item) => (
              <button
                className={item.active ? 'is-active' : ''}
                type="button"
                key={item.path}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            ))}
            {loggedPhone && (
              <button type="button" onClick={() => handleProfileSave({ full_name: '', phone: '' })}>
                {t('profile.logout')}
              </button>
            )}
          </aside>
        </div>
      )}

      <section className="content-shell">
        {showBackButton && <BackButton onClick={navigateBack} t={t} />}
        {error && <p className="notice notice-error">{error}</p>}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${route.pathname}${route.search.toString()}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
        <footer className="site-footer">
          <p>© Uncle Bondq - All rights reserved</p>
          <div>
            <a href="https://www.facebook.com/profile.php?id=61589280504896&mibextid=ZbWKwL" target="_blank" rel="noreferrer">
              <FaFacebookF aria-hidden="true" />
            </a>
            <a href="https://www.instagram.com/uncle_bondq?igsh=MWJ5NzNxemZtbWQwdw==" target="_blank" rel="noreferrer">
              <FaInstagram aria-hidden="true" />
            </a>
          </div>
        </footer>
      </section>

      <a className="whatsapp-button" href="https://wa.me/963934307797" target="_blank" rel="noreferrer" aria-label="WhatsApp">
        <FaWhatsapp aria-hidden="true" />
      </a>

      <BottomNav active={route.pathname} cartCount={cartCount} onNavigate={navigate} t={t} />

      <AnimatePresence>
        {selectedProduct && (
          <ProductModal
            key={selectedProduct.id}
            product={selectedProduct}
            t={t}
            quantity={modalQuantity}
            setQuantity={setModalQuantity}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={(product, quantity) => {
              addToCart(product, quantity)
              setSelectedProduct(null)
            }}
          />
        )}
      </AnimatePresence>
    </main>
  )
}

export default App
