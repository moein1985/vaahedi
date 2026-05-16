import { createFileRoute, Link } from '@tanstack/react-router'
import { Helmet } from 'react-helmet-async'
import { trpc } from '../trpc'
import { useState } from 'react'

export const Route = createFileRoute('/catalog/$productId')({
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const { productId } = Route.useParams()
  const [selectedImage, setSelectedImage] = useState(0)

  const { data: product, isLoading, isError } = trpc.product.getById.useQuery(
    { id: productId },
    { retry: false },
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (isError || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">محصول یافت نشد</h2>
          <p className="text-gray-600">محصول مورد نظر وجود ندارد یا هنوز تأیید نشده است.</p>
          <Link to="/catalog" className="mt-4 inline-block text-blue-600 hover:underline">بازگشت به کاتالوگ</Link>
        </div>
      </div>
    )
  }

  const images = product.media || []

  return (
    <>
      <Helmet>
        <title>{product.nameFa} | کاتالوگ</title>
        <meta name="description" content={product.description ?? `${product.nameFa} — کد HS: ${product.hsCode}`} />
        <meta property="og:title" content={product.nameFa} />
        <meta property="og:description" content={product.description ?? ''} />
        <link rel="canonical" href={`https://your-domain.ir/catalog/${product.id}`} />
      </Helmet>
      {/* Sticky Navbar */}
      <nav
        className="sticky top-0 z-20 px-6 py-3 flex items-center gap-3"
        dir="rtl"
        style={{ background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--sidebar-border)' }}
      >
        <Link
          to="/catalog"
          className="text-sm flex items-center gap-1 transition-opacity hover:opacity-80"
          style={{ color: 'var(--sidebar-text)' }}
        >
          ← بازگشت به کاتالوگ
        </Link>
        <span style={{ color: 'var(--sidebar-border)' }}>|</span>
        <span className="text-sm truncate" style={{ color: 'var(--sidebar-text)' }}>{product.nameFa}</span>
      </nav>
      <div className="max-w-6xl mx-auto p-6" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
            {images.length > 0 && images[selectedImage] ? (
              <img
                src={`/api/media/${images[selectedImage].fileKey}`}
                alt={product.nameFa}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="text-6xl mb-2">📦</div>
                  <p>تصویر موجود نیست</p>
                </div>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-[var(--brand-amber)]' : 'border-border'
                  }`}
                >
                  <img
                    src={`/api/media/${image.fileKey}`}
                    alt={`${product.nameFa} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{product.nameFa}</h1>
            {product.nameEn && (
              <p className="text-xl text-muted-foreground mb-4">{product.nameEn}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>کد HS: {product.hsCode}</span>
              {product.commodityGroup && <span>گروه: {product.commodityGroup}</span>}
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-foreground mb-3">اطلاعات فروشنده</h3>
            <div className="space-y-2">
              <Link
                to="/u/$userCode"
                params={{ userCode: product.user.userCode }}
                className="flex items-center space-x-3 hover:bg-background p-2 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-amber)' }}>
                  <span className="text-white font-medium">
                    {product.user.userCode.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {product.user.profile?.companyName || product.user.userCode}
                  </p>
                  <p className="text-sm text-muted-foreground">کد کاربری: {product.user.userCode}</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">مشخصات محصول</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {product.quantity && (
                <div>
                  <span className="text-muted-foreground">مقدار:</span>
                  <span className="mr-2 text-foreground">{product.quantity}</span>
                </div>
              )}
              {/* {product.unit && (
                <div>
                  <span className="text-gray-500">واحد:</span>
                  <span className="mr-2 text-gray-900">{product.unit}</span>
                </div>
              )} */}
              {/* {product.price && (
                <div>
                  <span className="text-gray-500">قیمت:</span>
                  <span className="mr-2 text-gray-900">
                    {new Intl.NumberFormat('fa-IR').format(parseFloat(product.price))} {product.currency}
                  </span>
                </div>
              )} */}
              {product.minOrder && (
                <div>
                  <span className="text-muted-foreground">حداقل سفارش:</span>
                  <span className="mr-2 text-foreground">{product.minOrder}</span>
                </div>
              )}
            </div>
          </div>

          {/* Trade Terms */}
          {product.deliveryTerms && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">شرایط تحویل</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-foreground">{product.deliveryTerms}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">توضیحات</h3>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-foreground whitespace-pre-line">{product.description}</p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4">
            <button
              className="w-full py-3 px-6 rounded-lg font-medium transition-opacity hover:opacity-90 text-white"
              style={{ background: 'linear-gradient(135deg, hsl(38 95% 52%), hsl(30 85% 40%))' }}
            >
              ارسال درخواست خرید
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
