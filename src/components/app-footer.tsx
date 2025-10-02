import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

export default function AppFooter() {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <h2 className="text-2xl font-bold font-headline bg-gradient-to-r from-[#2E4CA6] to-[#049DD9] bg-clip-text text-transparent">
                Hello TAXI
              </h2>
            </Link>
            <p className="text-sm text-muted-foreground">
              Tu servicio de taxi confiable con negociación de tarifa.
              Conectando pasajeros y conductores en todo Lima.
            </p>
          </div>

          {/* Servicios */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Servicios</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/ride"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Solicitar Viaje
                </Link>
              </li>
              <li>
                <Link
                  href="/drive"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Ser Conductor
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Quiénes Somos
                </Link>
              </li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Soporte</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/profile"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Mi Cuenta
                </Link>
              </li>
              <li>
                <Link
                  href="/about#faq"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Preguntas Frecuentes
                </Link>
              </li>
              <li>
                <Link
                  href="/about#contact"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Contáctanos
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Chiclayo, Perú</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <a
                  href="tel:+51987654321"
                  className="hover:text-primary transition-colors"
                >
                  +51 999 999 999
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:contacto@hellotaxi.pe"
                  className="hover:text-primary transition-colors"
                >
                  contacto@hellotaxi.com.pe
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright y Legal */}
        <div className="border-t mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} Hello TAXI. Todos los derechos
            reservados.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-primary transition-colors"
            >
              Privacidad
            </Link>
            <Link
              href="/terms"
              className="hover:text-primary transition-colors"
            >
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
