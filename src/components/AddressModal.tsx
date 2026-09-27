import React, { useState, useEffect, useRef } from "react";
import { useAddress } from "@/contexts/AddressContext";
import { useModal } from "@/contexts/ModalContext";
import {
  X,
  MapPin,
  PlusCircle,
  Search,
  LocateFixed,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import type { Address } from "@/types";
import AddressCard from "./AddressCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Bu global callback fonksiyonunu TypeScript'e tanıtıyoruz.
declare global {
  interface Window {
    initMap: () => void;
    gm_authFailure?: () => void;
  }
}

let googleMapsScriptPromise: Promise<void> | null = null;

const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  if (window.google?.maps?.places) return Promise.resolve();
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API anahtarı eksik."));
  }
  if (googleMapsScriptPromise) return googleMapsScriptPromise;

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry&callback=initMap`;
  script.async = true;
  script.defer = true;

  googleMapsScriptPromise = new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(
        new Error(
          "Google Maps yanıt vermedi. API key ve bağlantıyı kontrol edin.",
        ),
      );
    }, 15000);
    const fail = (error: Error) => {
      window.clearTimeout(timeout);
      reject(error);
    };

    window.gm_authFailure = () => {
      fail(new Error("Google Maps API anahtarı kabul edilmedi."));
    };
    window.initMap = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    script.onerror = () => {
      fail(
        new Error(
          "Google Maps yüklenemedi. İnternet bağlantınızı kontrol edin.",
        ),
      );
    };
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    googleMapsScriptPromise = null;
    throw error;
  });

  return googleMapsScriptPromise;
};

type AddressModalStep = "list" | "map_selection" | "form";

const AddressModal: React.FC = () => {
  const { isAddressModalOpen, closeAddressModal } = useModal();
  const {
    addresses,
    activeAddress,
    addAddress,
    updateAddress,
    setActiveAddress,
    deleteAddress,
  } = useAddress();

  const [step, setStep] = useState<AddressModalStep>("list");
  const [currentAddress, setCurrentAddress] = useState({
    id: 0,
    street: "",
    city: "",
    zipCode: "",
    details: "",
    title: "",
    name: "",
    surname: "",
    phoneNumber: "",
    buildingNo: "", // YENİ
    floor: "", // YENİ
    apartment: "", // YENİ
  });

  // Form doğrulama hataları
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    surname?: string;
    phoneNumber?: string;
  }>({});
  // Harita state'leri
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const addressSearchRef = useRef<HTMLInputElement>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({
    lat: 41.0082,
    lng: 28.9784,
  }); // Istanbul
  const [isLocating, setIsLocating] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [foundAddress, setFoundAddress] = useState<string>(""); // Haritadan bulunan adres
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // Google Maps API anahtarını Vite .env dosyasından alıyoruz
  const googleMapsApiKey =
    import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY ||
    "AIzaSyBC6ilvp_OeyqyLuog6W_m-GxxSp_mn3aU";

  useEffect(() => {
    if (!isAddressModalOpen || step !== "map_selection") {
      setMap(null);
      return;
    }
    if (!mapRef.current || map) return;

    let cancelled = false;
    setIsMapLoading(true);
    setMapError(null);

    loadGoogleMapsScript(googleMapsApiKey)
      .then(() => {
        if (cancelled || !mapRef.current) return;
        setMap(
          new google.maps.Map(mapRef.current, {
            center: mapCenter,
            zoom: 15,
            mapTypeControl: false,
            streetViewControl: false,
          }),
        );
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMapError(
            error instanceof Error ? error.message : "Google Maps yüklenemedi.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsMapLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAddressModalOpen, step, map, mapCenter, googleMapsApiKey]);

  // Harita'nın merkezi değiştiğinde çalışan listener
  useEffect(() => {
    if (!map) return;

    const listener = map.addListener("center_changed", () => {
      const newCenter = map.getCenter();
      if (newCenter) {
        setMapCenter(newCenter.toJSON());
      }
    });

    // Component unmount olduğunda listener'ı temizle (hafıza sızıntılarını önler)
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map]);

  useEffect(() => {
    if (!map || !addressSearchRef.current || step !== "map_selection") return;

    const autocomplete = new google.maps.places.Autocomplete(
      addressSearchRef.current,
      { fields: ["formatted_address", "geometry"] },
    );
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const location = place.geometry?.location;
      if (!location) {
        toast.error("Arama sonuçlarından bir adres seç.");
        return;
      }

      const center = location.toJSON();
      map.panTo(center);
      map.setZoom(17);
      setMapCenter(center);
      setFoundAddress(place.formatted_address ?? "");
    });

    return () => google.maps.event.removeListener(listener);
  }, [map, step]);

  // Harita merkezi değiştiğinde tersine coğrafi kodlama yap
  useEffect(() => {
    if (map && mapCenter && step === "map_selection") {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: mapCenter }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          setFoundAddress(results[0].formatted_address);
        } else {
          setFoundAddress("");
          setMapError(
            status === "REQUEST_DENIED"
              ? "Google Geocoding erişimi reddedildi (bu anahtarda billing etkin değil olabilir). Adresi elle girebilirsin."
              : `Adres bulunamadı (${status}). Adresi elle girebilirsin.`,
          );
        }
      });
    }
  }, [mapCenter, map, step]);

  const handleOpenNewAddressForm = () => {
    if (addresses.length >= 5) {
      toast.error(
        "Sie können nicht mehr als 5 Adressen hinzufügen. Bitte löschen Sie eine bestehende Adresse, um eine neue hinzuzufügen.",
      );
      return;
    }
    setStep("map_selection");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Haritadan gelen zorunlu alanlar
    if (!currentAddress.street || !currentAddress.city) {
      toast.error("Lütfen sokak ve şehir bilgilerini kontrol edin.");
      return;
    }

    // Basit form doğrulama (inline hata gösterimi)
    const nextErrors: {
      name?: string;
      surname?: string;
      phoneNumber?: string;
    } = {};
    if (!currentAddress.name) nextErrors.name = "Lütfen adınızı girin.";
    if (!currentAddress.surname)
      nextErrors.surname = "Lütfen soyadınızı girin.";
    const digits = (currentAddress.phoneNumber || "").replace(/\D/g, "");
    if (!digits || digits.length < 10)
      nextErrors.phoneNumber = "Geçerli bir cep telefonu girin.";

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }
    setFormErrors({});

    try {
      await addAddress({
        street: currentAddress.street,
        city: currentAddress.city,
        zipCode: currentAddress.zipCode,
        details: currentAddress.details,
        title: currentAddress.title,
        name: currentAddress.name,
        surname: currentAddress.surname,
        phoneNumber: currentAddress.phoneNumber,
      });

      closeAddressModal();
      setStep("list");
    } catch (error) {
      console.error("Adres eklenirken hata:", error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Adresse konnte nicht hinzugefügt werden.";
      toast.error(message);
    }
  };

  const handleSelectAddress = (address: Address) => {
    setActiveAddress(address);
    closeAddressModal();
    setStep("list");
  };

  const handleDeleteAddress = async (id: number) => {
    setAddressToDelete(id);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (addressToDelete !== null) {
      try {
        await deleteAddress(addressToDelete);
      } catch (error) {
        console.error("Adres silinirken hata:", error);
        toast.error("Adres silinirken bir hata oluştu.");
      } finally {
        setAddressToDelete(null);
        setIsAlertOpen(false);
      }
    } else {
      setIsAlertOpen(false);
    }
  };

  const handleFindMyLocation = () => {
    if (!map) {
      toast.error("Harita yüklenmeden konum bulunamıyor.");
      return;
    }

    if (!navigator.geolocation) {
      toast.error("Tarayıcınız konum servislerini desteklemiyor.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCenter = { lat: latitude, lng: longitude };

        map.panTo(newCenter);
        const currentZoom = map.getZoom();
        if (!currentZoom || currentZoom < 16) {
          map.setZoom(16);
        }

        setMapCenter(newCenter);

        if (marker) {
          marker.setPosition(newCenter);
          marker.setMap(map);
        } else {
          const newMarker = new google.maps.Marker({
            position: newCenter,
            map,
            animation: google.maps.Animation.DROP,
          });
          setMarker(newMarker);
        }

        toast.success("Konumun başarıyla bulundu.");
        setIsLocating(false);
      },
      (error: GeolocationPositionError) => {
        let message = "Konum alınırken bir sorun oluştu.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Konum izni reddedildi.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Konum bilgisi alınamıyor.";
            break;
          case error.TIMEOUT:
            message = "Konum isteği zaman aşımına uğradı.";
            break;
        }
        toast.error(message);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const handleUseThisLocation = () => {
    if (foundAddress) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: mapCenter }, (results, status) => {
        // address yerine location kullan
        if (status === "OK" && results && results[0]) {
          const addressComponents = results[0].address_components;

          // Tüm bileşenleri logla
          console.log("Address Components:", addressComponents);

          // Mahalle/Sokak bilgisi
          const neighborhood =
            addressComponents.find(
              (c) =>
                c.types.includes("neighborhood") ||
                c.types.includes("sublocality_level_1"),
            )?.long_name || "";

          const route =
            addressComponents.find((c) => c.types.includes("route"))
              ?.long_name || "";

          const street = route || neighborhood || foundAddress.split(",")[0];

          // Şehir bilgisi - Türkiye için
          const city =
            addressComponents.find((c) =>
              c.types.includes("administrative_area_level_1"),
            )?.long_name || // İl
            addressComponents.find((c) => c.types.includes("locality"))
              ?.long_name || // İlçe/Şehir
            "";

          // Posta kodu
          const zipCode =
            addressComponents.find((c) => c.types.includes("postal_code"))
              ?.long_name || "";

          console.log("Parsed Address:", { street, city, zipCode });

          if (!city) {
            toast.error(
              "Şehir bilgisi alınamadı. Lütfen manuel olarak giriniz.",
            );
          }

          setCurrentAddress((prev) => ({
            ...prev,
            street: street,
            city: city,
            zipCode: zipCode,
          }));
          setStep("form");
        } else {
          toast.error("Adres detayları alınamadı. Hata: " + status);
        }
      });
    }
  };

  const handleGoBack = () => {
    if (step === "form") setStep("map_selection");
    else if (step === "map_selection") setStep("list");
  };

  if (!isAddressModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md relative flex flex-col rounded-none shadow-none p-4 overflow-y-auto sm:overflow-visible sm:rounded-lg sm:shadow-lg sm:p-6">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-muted-foreground hover:bg-secondary"
          onClick={() => {
            closeAddressModal();
            setStep("list");
          }}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* --- 1. ADIM: KAYITLI ADRESLER LİSTESİ (Görsel 2) --- */}
        {step === "list" && (
          <div className="flex-grow flex flex-col">
            <h2 className="font-heading text-2xl font-bold mb-6">
              Gespeicherte Adressen
            </h2>
            <Button
              variant="outline"
              className="w-full mb-4 py-6 text-primary border-primary hover:bg-primary/5 hover:text-primary transition-colors"
              onClick={handleOpenNewAddressForm}
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Neue Adresse hinzufügen
            </Button>
            <div className="flex-grow overflow-y-auto space-y-4 p-4">
              {addresses.length === 0 ? (
                <p className="text-center text-muted">
                  Keine gespeicherten Adressen.
                </p>
              ) : (
                addresses.map((addr) => (
                  <AddressCard
                    key={addr.id}
                    address={addr}
                    active={activeAddress?.id === addr.id}
                    selectable
                    onSelect={(address) => handleSelectAddress(address)}
                    onDelete={handleDeleteAddress}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* --- 2. ADIM: HARİTA ÜZERİNDEN KONUM SEÇİMİ (Görsel 3 & 4) --- */}
        {step === "map_selection" && (
          <div className="flex-grow flex flex-col">
            <h2 className="font-heading text-xl font-bold mb-2">
              Teslimat Adresi Seç
            </h2>
            <p className="text-muted text-sm mb-4">
              Harita üzerinde bina girişini seçtiğinden emin ol. Bina girişini
              doğru seçmediğin durumlarda siparişinin teslimatıyla ilgili sorun
              yaşayabilirsin.
            </p>

            {/* Arama çubuğu ve Konumumu Bul butonu */}
            <div className="flex items-center gap-2 mb-4">
              <Input
                label="Adres ara"
                containerClassName="flex-grow"
                leadingIcon={<Search className="h-4 w-4" />}
                ref={addressSearchRef}
              />
              <Button
                variant="outline"
                className="text-primary border-primary flex-shrink-0"
                onClick={handleFindMyLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Konum alınıyor...
                  </>
                ) : (
                  <>
                    <LocateFixed className="mr-2 h-4 w-4" />
                    Konumumu Bul
                  </>
                )}
              </Button>
            </div>
            <div className="relative mb-4 h-[300px] w-full flex-grow overflow-hidden rounded-lg">
              <div ref={mapRef} id="map" className="h-full w-full" />
              {map && !mapError && (
                <MapPin className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-9 w-9 -translate-x-1/2 -translate-y-full fill-primary text-white drop-shadow-md" />
              )}
              {isMapLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 text-sm text-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Harita yükleniyor...
                </div>
              )}
              {mapError && (
                <div
                  role="alert"
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-background/95 p-6 text-center text-sm text-destructive"
                >
                  <p>{mapError}</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCurrentAddress((previous) => ({
                        ...previous,
                        street: "",
                        city: "",
                        zipCode: "",
                      }));
                      setStep("form");
                    }}
                  >
                    Adresi elle gir
                  </Button>
                </div>
              )}
            </div>

            {foundAddress && (
              <div className="bg-secondary p-3 rounded-md mb-4 text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-foreground font-semibold">
                  {foundAddress}
                </span>
              </div>
            )}

            {/* Geri Dön ve Bu Konumu Kullan Butonları */}
            <div className="flex gap-4 mt-auto pt-4 border-t border-secondary">
              <Button
                variant="outline"
                className="flex-grow"
                onClick={handleGoBack}
              >
                Geri Dön
              </Button>
              <Button
                variant="default"
                className="flex-grow bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleUseThisLocation}
                disabled={
                  !map || !foundAddress || foundAddress === "Adres bulunamadı."
                }
              >
                Bu Konumu Kullan
              </Button>
            </div>
          </div>
        )}

        {/* --- 3. ADIM: ADRES BİLGİLERİNİ TAMAMLAMA FORMU (Görsel 5) --- */}
        {step === "form" && (
          <div className="flex-grow flex flex-col">
            <h2 className="font-heading text-xl font-bold mb-2">Adres Ekle</h2>

            {/* Harita Önizlemesi ve Düzenle Butonu */}
            <div className="relative w-full h-[150px] rounded-lg mb-4 overflow-hidden">
              <div
                id="map-preview"
                className="w-full h-full bg-secondary flex items-center justify-center text-muted"
              >
                Harita Önizlemesi
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 left-2"
                onClick={() => setStep("map_selection")}
              >
                Düzenle
              </Button>
            </div>

            <p className="text-muted text-xs mb-4">
              Adres ve İletişim Bilgileri
            </p>

            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
              <div className="flex items-center gap-2 bg-secondary p-3 rounded-md">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">
                  {foundAddress || "Adres Yükleniyor..."}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto text-muted-foreground hover:bg-secondary/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Başlık alanı (önde ve belirgin) */}
              <div>
                <Input
                  label="Adres Başlığı"
                  value={currentAddress.title}
                  onChange={(e) =>
                    setCurrentAddress({
                      ...currentAddress,
                      title: e.target.value,
                    })
                  }
                  supportingText="Tanımlayıcı bir başlık ekleyebilirsiniz."
                />
              </div>

              {/* Adres detayları grup */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  Adres Detayları
                </p>
                <div className="mb-3 grid gap-2">
                  <Input
                    label="Sokak ve kapı numarası"
                    value={currentAddress.street}
                    onChange={(event) =>
                      setCurrentAddress({
                        ...currentAddress,
                        street: event.target.value,
                      })
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      label="Şehir"
                      value={currentAddress.city}
                      onChange={(event) =>
                        setCurrentAddress({
                          ...currentAddress,
                          city: event.target.value,
                        })
                      }
                    />
                    <Input
                      label="Posta kodu"
                      value={currentAddress.zipCode}
                      onChange={(event) =>
                        setCurrentAddress({
                          ...currentAddress,
                          zipCode: event.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Input
                      label="Bina No"
                      value={currentAddress.buildingNo}
                      onChange={(e) =>
                        setCurrentAddress({
                          ...currentAddress,
                          buildingNo: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Input
                      label="Kat"
                      value={currentAddress.floor}
                      onChange={(e) =>
                        setCurrentAddress({
                          ...currentAddress,
                          floor: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Input
                      label="Daire"
                      value={currentAddress.apartment}
                      onChange={(e) =>
                        setCurrentAddress({
                          ...currentAddress,
                          apartment: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm">Adres Tarifi (opsiyonel)</Label>
                <Textarea
                  placeholder="Kapı rengi, yakın nokta vb."
                  value={currentAddress.details}
                  onChange={(e) =>
                    setCurrentAddress({
                      ...currentAddress,
                      details: e.target.value,
                    })
                  }
                  className="mt-1"
                />
              </div>

              {/* İletişim bilgileri grup */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  İletişim Bilgileri
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Input
                      label="Adınız"
                      value={currentAddress.name}
                      onChange={(e) =>
                        setCurrentAddress({
                          ...currentAddress,
                          name: e.target.value,
                        })
                      }
                      error={formErrors.name}
                    />
                  </div>
                  <div>
                    <Input
                      label="Soyadınız"
                      value={currentAddress.surname}
                      onChange={(e) =>
                        setCurrentAddress({
                          ...currentAddress,
                          surname: e.target.value,
                        })
                      }
                      error={formErrors.surname}
                    />
                  </div>
                  <div>
                    <Input
                      label="Cep Telefonu"
                      type="tel"
                      value={currentAddress.phoneNumber}
                      onChange={(e) =>
                        setCurrentAddress({
                          ...currentAddress,
                          phoneNumber: e.target.value,
                        })
                      }
                      error={formErrors.phoneNumber}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-auto pt-4 border-t border-secondary">
              <Button
                variant="outline"
                className="flex-grow"
                onClick={handleGoBack}
              >
                Geri Dön
              </Button>
              <Button
                variant="default"
                className="flex-grow bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleSubmit}
              >
                Kaydet
              </Button>
            </div>
          </div>
        )}
      </div>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-card border-none text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">
              Bist du dir absolut sicher?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted">
              Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird
              deine Adresse dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AddressModal;
