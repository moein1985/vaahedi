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

  const { data: product, isLoading } = trpc.product.getById.useQuery({ id: productId })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">محصول یافت نشد</h2>
          <p className="text-gray-600">محصول مورد نظر وجود ندارد.</p>
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
      <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {images.length > 0 && images[selectedImage] ? (
              <img
                src={`/api/media/${images[selectedImage].fileKey}`}
                alt={product.nameFa}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
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
                    selectedImage === index ? 'border-blue-500' : 'border-gray-200'
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.nameFa}</h1>
            {product.nameEn && (
              <p className="text-xl text-gray-600 mb-4">{product.nameEn}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>کد HS: {product.hsCode}</span>
              {product.commodityGroup && <span>گروه: {product.commodityGroup}</span>}
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">اطلاعات فروشنده</h3>
            <div className="space-y-2">
              <Link
                to="/u/$userCode"
                params={{ userCode: product.user.userCode }}
                className="flex items-center space-x-3 hover:bg-white p-2 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {product.user.userCode.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {product.user.profile?.companyName || product.user.userCode}
                  </p>
                  <p className="text-sm text-gray-600">کد کاربری: {product.user.userCode}</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">مشخصات محصول</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {product.quantity && (
                <div>
                  <span className="text-gray-500">مقدار:</span>
                  <span className="mr-2 text-gray-900">{product.quantity}</span>
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
                  <span className="text-gray-500">حداقل سفارش:</span>
                  <span className="mr-2 text-gray-900">{product.minOrder}</span>
                </div>
              )}
            </div>
          </div>

          {/* Trade Terms */}
          {product.deliveryTerms && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">شرایط تحویل</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">{product.deliveryTerms}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">توضیحات</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-line">{product.description}</p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-4">
            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors">
              ارسال درخواست خرید
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
