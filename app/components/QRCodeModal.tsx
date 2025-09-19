"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, Download, QrCode } from "lucide-react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
}

interface QRCodeData {
  joinLink: string;
  qrCode: string;
  group: {
    id: string;
    name: string;
    city: string;
    country: string;
    readingTime: string;
    maxParticipants: number;
  };
}

export default function QRCodeModal({ isOpen, onClose, groupId, groupName }: QRCodeModalProps) {
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && groupId) {
      generateQRCode();
    }
  }, [isOpen, groupId]);

  const generateQRCode = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/groups/${groupId}/qr-code`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка генерации QR кода");
      }

      setQrData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (qrData?.joinLink) {
      try {
        await navigator.clipboard.writeText(qrData.joinLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Ошибка копирования:", err);
      }
    }
  };

  const downloadQRCode = () => {
    if (qrData?.qrCode) {
      const link = document.createElement('a');
      link.download = `qr-code-${groupName.replace(/\s+/g, '-')}.png`;
      link.href = qrData.qrCode;
      link.click();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm border-saffron-200">
        <DialogHeader>
          <DialogTitle className="text-saffron-800 text-xl">
            QR код для присоединения к группе
          </DialogTitle>
          <DialogDescription className="text-saffron-600">
            Поделитесь этим QR кодом или ссылкой для присоединения к группе "{groupName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-saffron-500" />
              <p className="text-saffron-600">Генерация QR кода...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={generateQRCode} variant="outline">
                Попробовать снова
              </Button>
            </div>
          ) : qrData ? (
            <>
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border border-saffron-200 inline-block mb-4">
                  <img 
                    src={qrData.qrCode} 
                    alt="QR код для присоединения к группе"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-saffron-600 mb-4">
                  Отсканируйте QR код для присоединения к группе
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-saffron-700 mb-2 block">
                    Ссылка для присоединения:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={qrData.joinLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-saffron-200 rounded-lg text-sm bg-saffron-50"
                    />
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      size="sm"
                      className="border-saffron-200"
                    >
                      {copied ? (
                        "Скопировано!"
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Копировать
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={downloadQRCode}
                    variant="outline"
                    className="flex-1 border-saffron-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Скачать QR код
                  </Button>
                  <Button
                    onClick={generateQRCode}
                    variant="outline"
                    className="flex-1 border-saffron-200"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Обновить
                  </Button>
                </div>
              </div>

              {qrData.group && (
                <div className="bg-saffron-50 rounded-lg p-4">
                  <h3 className="font-medium text-saffron-800 mb-2">Информация о группе</h3>
                  <div className="space-y-1 text-sm text-saffron-600">
                    <p><strong>Название:</strong> {qrData.group.name}</p>
                    <p><strong>Местоположение:</strong> {qrData.group.city}, {qrData.group.country}</p>
                    <p><strong>Время чтения:</strong> {qrData.group.readingTime}</p>
                    <p><strong>Макс. участников:</strong> {qrData.group.maxParticipants}</p>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose} variant="outline" className="border-saffron-200 text-saffron-700">
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
