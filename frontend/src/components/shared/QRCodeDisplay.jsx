import { Card, CardContent } from '@/components/ui/card'
import { QrCode, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

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
          
          {/* QR Code Placeholder - In production, use a QR library like qrcode.react */}
          <div 
            className="mx-auto bg-white border-2 border-gray-200 rounded-xl p-4 flex items-center justify-center"
            style={{ width: size + 32, height: size + 32 }}
          >
            <div 
              className="bg-gradient-to-br from-rewardly-light-blue to-white rounded-lg flex items-center justify-center border border-gray-100"
              style={{ width: size, height: size }}
            >
              {/* Placeholder QR pattern */}
              <div className="text-center">
                <QrCode className="h-24 w-24 text-rewardly-blue mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-mono break-all px-4">
                  {value?.substring(0, 20)}...
                </p>
              </div>
            </div>
          </div>

          {/* Copy ID Button */}
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
                  Copy ID
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

