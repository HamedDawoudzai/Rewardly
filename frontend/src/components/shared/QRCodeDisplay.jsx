import { Card, CardContent } from '@/components/ui/card'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { QRCodeSVG } from 'qrcode.react'

const QRCodeDisplay = ({ value, title, subtitle, size = 200 }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardContent className="pt-6">
        <div className="text-center">
          {title && (
            <h3 className="text-lg font-semibold text-rewardly-dark-navy mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 mb-4">{subtitle}</p>
          )}
          
          {/* QR Code */}
          <div 
            className="mx-auto bg-white border-2 border-gray-200 rounded-xl p-4 flex items-center justify-center"
            style={{ width: size + 32, height: size + 32 }}
          >
            <QRCodeSVG
              value={value || 'INVALID'}
              size={size}
              bgColor="#ffffff"
              fgColor="#1e3a5f"
              level="M"
              includeMargin={false}
            />
          </div>

          {/* Value Display */}
          <div className="mt-3 px-4">
            <p className="text-sm text-gray-600 font-mono bg-gray-50 py-2 px-3 rounded-lg break-all">
              {value}
            </p>
          </div>

          {/* Copy Button */}
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Value
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default QRCodeDisplay
