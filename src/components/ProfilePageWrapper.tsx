import React, { useState, useEffect } from "react";
import { useCart, usePaymentMethods } from "@/contexts";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AddressProvider, useAddress } from "@/contexts/AddressContext";
import {
  CartProvider,
  NotificationProvider,
  OrderTrackingProvider,
  ReviewProvider,
  FavoritesProvider,
  LanguageProvider,
} from "@/contexts";
import { ModalProvider } from "@/contexts/ModalContext";
import { SearchProvider } from "@/contexts/SearchContext";
import { PaymentMethodsProvider } from "@/contexts/PaymentMethodsContext";
import AppLayout from "./AppLayout";
import { Button } from "./ui/button";
import { Trash2, PlusCircle, LogOut, CreditCard, Calendar, MapPin, User, Edit, Star } from "lucide-react";
import { buildApiUrl } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import AddressCard from "./AddressCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ProductDetail from "./ProductDetail";
import { useModal } from "@/contexts/ModalContext";

const ProfilePage: React.FC = () => {
  const { token, logout, linkGoogleAccount, unlinkGoogleAccount, isGoogleLinked } = useAuth();
  const { addresses, deleteAddress, openAddressModal } = useAddress();
  const { clearCart } = useCart();
  const { paymentMethods, loading: paymentLoading, deletePaymentMethod, setDefaultPaymentMethod, createSetupIntent, addPaymentMethod } = usePaymentMethods();

  const [user, setUser] = useState<{
    name: string | null;
    email: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [addressToDelete, setAddressToDelete] = useState<number | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (token) {
      const fetchUserData = async () => {
        try {
          const response = await fetch(buildApiUrl("/api/me"), {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch user data");
          }

          const userData = await response.json();
          setUser(userData);
        } catch (error) {
          console.error(error);
          logout();
          window.location.href = "/";
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    } else {
      window.location.href = "/";
    }
  }, [token, logout]);

  const handleLogout = () => {
    logout();
    clearCart();
    window.location.href = "/";
  };

  const handleDeleteAddress = (id: number) => {
    setAddressToDelete(id);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!addressToDelete) return;
    await deleteAddress(addressToDelete);
    setAddressToDelete(null);
    setIsAlertOpen(false);
  };

  const handleAddCard = async () => {
    if (!token) return;
    setIsProcessing(true);
    try {
      const clientSecret = await createSetupIntent();
      if (!clientSecret) {
        throw new Error("Setup Intent konnte nicht erstellt werden.");
      }
      await addPaymentMethod(clientSecret);
      setIsAddCardModalOpen(false);
    } catch (error) {
      console.error("Fehler beim Hinzufügen einer Karte", error);
    } finally {
      setIsProcessing(false);
    }
  };

    if (loading) {
    return <p className="p-8 text-center text-muted">Profil wird geladen…</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Profil-Kopfbereich */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-heading text-xl">
                  Willkommen zurück,
                </CardTitle>
                <CardDescription className="text-muted">
                  {user.name ?? user.email}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm text-muted">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="h-4 w-4" />
                <span className="text-primary">
                  Treueprogramm startet bald – bleib dran!
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Adressverwaltung */}
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-xl">
                Lieferadressen
              </CardTitle>
              <Button onClick={openAddressModal} size="sm" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Neue Adresse
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {addresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    onDelete={() => handleDeleteAddress(address.id)}
                  />
                ))}
                {addresses.length === 0 && (
                  <p className="text-sm text-muted">
                    Du hast noch keine Adresse hinterlegt.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zahlungsinformationen */}
        <div className="space-y-6">
          <Card className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-xl">Zahlungsmittel</CardTitle>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => setIsAddCardModalOpen(true)}
              >
                <CreditCard className="h-4 w-4" />
                Karte hinzufügen
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {paymentLoading ? (
                <p className="text-muted text-sm">Lade Zahlungsmethoden…</p>
              ) : paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">
                          {method.brand} •••• {method.last4}
                        </p>
                        <p className="text-xs text-muted">
                          Gültig bis {method.expMonth}/{method.expYear}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDefaultPaymentMethod(method.id)}
                        >
                          Als Standard setzen
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePaymentMethod(method.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <Card className="bg-card border-border">
                  <CardContent className="p-6 text-center text-muted">
                    Keine gespeicherten Zahlungsmethoden.
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="font-heading text-xl">
                Google Konto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4" />
                <span>
                  Verknüpfe dein Google Konto, um noch schneller zu bestellen.
                </span>
              </div>
              <Button
                variant={isGoogleLinked ? "secondary" : "default"}
                onClick={isGoogleLinked ? unlinkGoogleAccount : linkGoogleAccount}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                {isGoogleLinked
                  ? "Google-Verknüpfung aufheben"
                  : "Mit Google verbinden"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Adresse löschen Dialog */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="bg-card border-none text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading">
              Adresse wirklich löschen?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Karte hinzufügen Dialog */}
      <AlertDialog open={isAddCardModalOpen} onOpenChange={setIsAddCardModalOpen}>
        <AlertDialogContent className="bg-card border-none text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl">
              Neue Karte hinzufügen
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted">
              Füge eine neue Zahlungsmethode hinzu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border border-dashed border-primary/40 p-6 text-center text-sm text-muted">
            Stripe-Setup folgt – hier wird aktuell nur ein Platzhalter angezeigt.
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAddCard}
              disabled={isProcessing}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isProcessing ? "Wird hinzugefügt…" : "Karte hinzufügen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const GlobalProductModal: React.FC = () => {
  const { productToShow, closeProductDetailModal } = useModal();
  return (
    <Dialog open={!!productToShow} onOpenChange={closeProductDetailModal}>
      <DialogContent className="bg-card border-none text-foreground p-0">
        {productToShow && (
          <ProductDetail
            product={productToShow}
            onClose={closeProductDetailModal}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

const ProfilePageWrapper: React.FC = () => (
  <LanguageProvider>
    <AuthProvider>
      <FavoritesProvider>
        <NotificationProvider>
          <OrderTrackingProvider>
            <AddressProvider>
              <CartProvider>
                <PaymentMethodsProvider>
                  <ModalProvider>
                    <SearchProvider>
                      <ReviewProvider>
                        <AppLayout>
                          <ProfilePage />
                        </AppLayout>
                        <GlobalProductModal />
                      </ReviewProvider>
                    </SearchProvider>
                  </ModalProvider>
                </PaymentMethodsProvider>
              </CartProvider>
            </AddressProvider>
          </OrderTrackingProvider>
        </NotificationProvider>
      </FavoritesProvider>
    </AuthProvider>
  </LanguageProvider>
);

export default ProfilePageWrapper;
