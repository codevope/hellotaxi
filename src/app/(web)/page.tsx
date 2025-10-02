"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/app-header";
import AppFooter from "@/components/app-footer";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  CircleDollarSign,
  Star,
  MapPin,
  MessagesSquare,
  Car,
  Zap,
  Navigation,
  Users,
  Clock,
  Sparkles,
  TrendingUp,
  Award,
  ArrowRight,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [currentCarIndex, setCurrentCarIndex] = useState(0);

  const cars = [
    {
      name: "SUV Premium",
      image: "/img/suv.png",
      price: "S/ 25",
      capacity: "6",
      gradient: "from-[#2E4CA6] to-[#0477BF]",
    },
    {
      name: "Sedán Confort",
      image: "/img/sedan.png",
      price: "S/ 18",
      capacity: "4",
      gradient: "from-[#0477BF] to-[#049DD9]",
    },
    {
      name: "Hatchback",
      image: "/img/hatchback.png",
      price: "S/ 12",
      capacity: "4",
      gradient: "from-[#049DD9] to-[#05C7F2]",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCarIndex((prev) => (prev + 1) % cars.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <main className="flex-1">
        <section className="relative min-h-[95vh] flex items-center overflow-hidden bg-gradient-to-br from-[#2E4CA6] via-[#0477BF] to-[#049DD9]">
          <div className="absolute inset-0 z-0">
            <Image
              src="/img/bg-hero.jpg"
              alt="Vista de la ciudad desde un coche"
              fill
              className="object-cover opacity-20"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#2E4CA6]/90 via-[#0477BF]/85 to-[#049DD9]/80"></div>
          </div>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, Math.random() * 20 - 10, 0],
                  opacity: [0.1, 0.3, 0.1],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              >
                <div className="w-2 h-2 bg-white/30 rounded-full blur-sm" />
              </motion.div>
            ))}
          </div>

          {/* Ondas decorativas animadas */}
          <motion.div
            className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] bg-[#05C7F2]/10 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-1/2 -right-1/4 w-[800px] h-[800px] bg-[#049DD9]/10 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.1, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                className="text-white space-y-8"
                initial={{ opacity: 0, x: -100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur-md px-4 py-2 text-sm">
                    <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                    #1 Servicio de Taxi en tu Ciudad
                  </Badge>
                </motion.div>

                {/* Título principal */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h1 className="text-5xl md:text-7xl font-bold font-headline mb-6 leading-tight">
                    Tu Viaje,{" "}
                    <motion.span
                      className="inline-block bg-gradient-to-r from-[#05C7F2] via-white to-[#05C7F2] bg-clip-text text-transparent"
                      animate={{
                        backgroundPosition: ["0%", "100%", "0%"],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      style={{ backgroundSize: "200% 200%" }}
                    >
                      Tu Tarifa
                    </motion.span>
                    <br />
                    Tu Ciudad
                  </h1>
                  <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-xl">
                    Experimenta la libertad de negociar tu tarifa y viaja con
                    conductores de confianza.{" "}
                    <span className="font-semibold text-[#05C7F2]">
                      Rápido, seguro y justo.
                    </span>
                  </p>
                </motion.div>

                {/* Características destacadas */}
                <motion.div
                  className="grid grid-cols-2 gap-4"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {[
                    { icon: CheckCircle2, text: "Tarifas Justas" },
                    { icon: Zap, text: "Llegada Rápida" },
                    { icon: ShieldCheck, text: "100% Seguro" },
                    { icon: Clock, text: "Disponible 24/7" },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl p-4"
                      whileHover={{
                        scale: 1.05,
                        backgroundColor: "rgba(255,255,255,0.2)",
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-[#05C7F2] rounded-lg p-2">
                        <item.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="font-semibold">{item.text}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Botones de CTA */}
                <motion.div
                  className="flex flex-col sm:flex-row gap-4 pt-4"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      asChild
                      size="lg"
                      className="font-bold text-lg px-8 py-7 bg-white text-[#2E4CA6] hover:bg-[#05C7F2] hover:text-white shadow-2xl group"
                    >
                      <Link href="/ride">
                        <Car className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                        Solicitar Viaje Ahora
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                      </Link>
                    </Button>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="font-bold text-lg px-8 py-7 bg-transparent text-white border-2 border-white/30 hover:bg-white/10 hover:border-white backdrop-blur-sm"
                    >
                      <Link href="/driver">
                        <Users className="mr-2 h-5 w-5" />
                        Ser Conductor
                      </Link>
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* LADO DERECHO - SHOWCASE DE AUTOS ANIMADO */}
              <motion.div
                className="relative h-[600px] hidden lg:block"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                {/* Contenedor principal del auto */}
                <div className="relative h-full flex items-center justify-center">
                  {/* Círculo decorativo grande */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 30,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <div className="w-[500px] h-[500px] rounded-full border-2 border-white/10 border-dashed" />
                  </motion.div>

                  {/* Círculo decorativo mediano */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ rotate: -360 }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <div className="w-[380px] h-[380px] rounded-full border-2 border-white/5" />
                  </motion.div>

                  {/* Auto principal con animación */}
                  <motion.div
                    key={currentCarIndex}
                    className="relative z-20"
                    initial={{ opacity: 0, scale: 0.5, rotateY: -90 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.5, rotateY: 90 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  >
                    <motion.div
                      className="relative w-[450px] h-[300px]"
                      animate={{
                        y: [0, -25, 0],
                        rotateZ: [0, 3, 0, -3, 0],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <Image
                        src={cars[currentCarIndex].image}
                        alt={cars[currentCarIndex].name}
                        fill
                        className="object-contain drop-shadow-2xl"
                        priority
                      />

                      {/* Brillo animado sobre el auto */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        animate={{
                          x: ["-100%", "200%"],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          repeatDelay: 2,
                        }}
                      />
                    </motion.div>
                  </motion.div>

                  {/* Indicadores de navegación */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-3 z-40">
                    {cars.map((_, idx) => (
                      <motion.button
                        key={idx}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          idx === currentCarIndex
                            ? "w-8 bg-white"
                            : "w-2 bg-white/40"
                        }`}
                        onClick={() => setCurrentCarIndex(idx)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      />
                    ))}
                  </div>

                  {/* Iconos flotantes alrededor */}
                  {[
                    { Icon: MapPin, angle: 45, distance: 250 },
                    { Icon: Navigation, angle: 135, distance: 220 },
                    { Icon: Sparkles, angle: 225, distance: 240 },
                    { Icon: Award, angle: 315, distance: 230 },
                  ].map(({ Icon, angle, distance }, idx) => {
                    const x = Math.cos((angle * Math.PI) / 180) * distance;
                    const y = Math.sin((angle * Math.PI) / 180) * distance;
                    return (
                      <motion.div
                        key={idx}
                        className="absolute top-1/2 left-1/2 bg-white/20 backdrop-blur-md rounded-full p-4"
                        style={{
                          x: x,
                          y: y,
                        }}
                        animate={{
                          y: [y, y - 20, y],
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 3,
                          delay: idx * 0.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Indicador de scroll animado */}
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex flex-col items-center gap-2 text-white/60">
              <span className="text-sm">Descubre más</span>
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ArrowRight className="h-6 w-6 rotate-90" />
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* How it Works Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-[#F2F2F2] via-white to-[#F2F2F2]/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12 font-headline bg-gradient-to-r from-[#2E4CA6] to-[#0477BF] bg-clip-text text-transparent">
              ¿Cómo Funciona?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="group flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-[#05C7F2]/20">
                <div className="p-6 bg-gradient-to-br from-[#05C7F2]/10 to-[#049DD9]/10 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-12 w-12 text-[#049DD9]" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#2E4CA6]">
                  1. Elige tu Ruta
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Ingresa tu punto de recojo y tu destino en el mapa.
                </p>
              </div>
              <div className="group flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-[#0477BF]/20">
                <div className="p-6 bg-gradient-to-br from-[#0477BF]/10 to-[#2E4CA6]/10 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                  <MessagesSquare className="h-12 w-12 text-[#0477BF]" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#2E4CA6]">
                  2. Negocia tu Tarifa
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Acepta el precio sugerido o haz tu propia oferta al conductor.
                </p>
              </div>
              <div className="group flex flex-col items-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-[#2E4CA6]/20">
                <div className="p-6 bg-gradient-to-br from-[#2E4CA6]/10 to-[#0477BF]/10 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Car className="h-12 w-12 text-[#2E4CA6]" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#2E4CA6]">
                  3. Viaja Seguro
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Un conductor verificado aceptará tu viaje y te llevará a tu
                  destino.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold font-headline mb-4 bg-gradient-to-r from-[#2E4CA6] to-[#049DD9] bg-clip-text text-transparent">
                Nuestros Servicios
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Elige el servicio que mejor se adapte a tus necesidades y
                presupuesto
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Economy Service */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0477BF] to-[#049DD9] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-500"></div>
                <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-[#049DD9]/20 dark:border-[#049DD9]/30">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0477BF] to-[#049DD9]"></div>

                  <div className="p-8">
                    <div className="relative h-32 mb-6 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#049DD9]/10 to-[#05C7F2]/10 dark:from-[#049DD9]/20 dark:to-[#05C7F2]/20 rounded-xl"></div>
                      <Image
                        src="/img/hatchback.png"
                        alt="Servicio Economy - Hatchback"
                        width={120}
                        height={80}
                        className="relative z-10 object-contain filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2 text-[#0477BF] dark:text-[#049DD9]">
                        Economy
                      </h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        La opción más{" "}
                        <span className="font-semibold text-[#0477BF]">
                          económica
                        </span>{" "}
                        para viajes cotidianos. Eficiencia y ahorro
                        garantizados.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#0477BF] rounded-full"></div>
                        <span>Vehículos compactos y eficientes</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#0477BF] rounded-full"></div>
                        <span>Aire acondicionado estándar</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#0477BF] rounded-full"></div>
                        <span>Tarifas ultra competitivas</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#0477BF] rounded-full"></div>
                        <span>Capacidad: 1-3 pasajeros</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#049DD9]/20 dark:border-[#049DD9]/30">
                      <p className="text-xs text-center text-muted-foreground">
                        Perfecto para trayectos urbanos
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comfort Service */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#2E4CA6] to-[#0477BF] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-500"></div>
                <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-[#2E4CA6]/20 dark:border-[#2E4CA6]/30">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2E4CA6] to-[#0477BF]"></div>

                  <div className="p-8">
                    <div className="relative h-32 mb-6 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#2E4CA6]/10 to-[#0477BF]/10 dark:from-[#2E4CA6]/20 dark:to-[#0477BF]/20 rounded-xl"></div>
                      <Image
                        src="/img/sedan.png"
                        alt="Servicio Comfort - Sedan"
                        width={140}
                        height={90}
                        className="relative z-10 object-contain filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2 text-[#2E4CA6] dark:text-[#0477BF]">
                        Comfort
                      </h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        El equilibrio perfecto entre{" "}
                        <span className="font-semibold text-[#2E4CA6]">
                          comodidad y precio
                        </span>
                        . Ideal para viajes de negocios.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#2E4CA6] rounded-full"></div>
                        <span>Sedanes espaciosos y elegantes</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#2E4CA6] rounded-full"></div>
                        <span>Asientos ergonómicos premium</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#2E4CA6] rounded-full"></div>
                        <span>WiFi gratuito disponible</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#2E4CA6] rounded-full"></div>
                        <span>Capacidad: 1-4 pasajeros</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#2E4CA6]/20 dark:border-[#2E4CA6]/30">
                      <p className="text-xs text-center text-muted-foreground">
                        Recomendado para trayectos largos
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exclusive Service */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#049DD9] to-[#05C7F2] rounded-2xl blur opacity-0 group-hover:opacity-20 transition-all duration-500"></div>
                <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-[#05C7F2]/20 dark:border-[#05C7F2]/30">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#049DD9] to-[#05C7F2]"></div>

                  <div className="p-8">
                    <div className="relative h-32 mb-6 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#049DD9]/10 to-[#05C7F2]/10 dark:from-[#049DD9]/20 dark:to-[#05C7F2]/20 rounded-xl"></div>
                      <Image
                        src="/img/suv.png"
                        alt="Servicio Exclusivo - SUV"
                        width={160}
                        height={100}
                        className="relative z-10 object-contain filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2 text-[#049DD9] dark:text-[#05C7F2]">
                        Exclusivo
                      </h3>
                      <p className="text-muted-foreground mb-4 leading-relaxed">
                        La experiencia{" "}
                        <span className="font-semibold text-[#049DD9]">
                          premium definitiva
                        </span>
                        . Lujo y confort sin compromisos.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#049DD9] rounded-full"></div>
                        <span>SUVs de alta gama y lujo</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#049DD9] rounded-full"></div>
                        <span>Asientos de cuero premium</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#049DD9] rounded-full"></div>
                        <span>Amenities y refreshments</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-[#049DD9] rounded-full"></div>
                        <span>Capacidad: 1-6 pasajeros</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#05C7F2]/20 dark:border-[#05C7F2]/30">
                      <p className="text-xs text-center text-muted-foreground">
                        Para ocasiones especiales
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 lg:py-24 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16 font-headline bg-gradient-to-r from-[#2E4CA6] to-[#049DD9] bg-clip-text text-transparent">
              ¿Por qué elegir Hello Taxi?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="group flex items-start gap-6 p-6 rounded-2xl hover:bg-gradient-to-br hover:from-[#05C7F2]/5 hover:to-[#049DD9]/5 transition-all duration-500 hover:shadow-lg">
                <div className="p-4 bg-gradient-to-br from-[#05C7F2]/10 to-[#049DD9]/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <CircleDollarSign className="h-10 w-10 text-[#049DD9]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-[#2E4CA6]">
                    Negociación Justa
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Ofrece tu propio precio o acepta la tarifa sugerida. Tú
                    tienes el control de lo que pagas por tu viaje.
                  </p>
                </div>
              </div>
              <div className="group flex items-start gap-6 p-6 rounded-2xl hover:bg-gradient-to-br hover:from-[#0477BF]/5 hover:to-[#2E4CA6]/5 transition-all duration-500 hover:shadow-lg">
                <div className="p-4 bg-gradient-to-br from-[#0477BF]/10 to-[#2E4CA6]/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="h-10 w-10 text-[#0477BF]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-[#2E4CA6]">
                    Seguridad Primero
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Todos nuestros conductores pasan por un riguroso proceso de
                    verificación y cuentas con un botón de pánico SOS.
                  </p>
                </div>
              </div>
              <div className="group flex items-start gap-6 p-6 rounded-2xl hover:bg-gradient-to-br hover:from-[#2E4CA6]/5 hover:to-[#0477BF]/5 transition-all duration-500 hover:shadow-lg">
                <div className="p-4 bg-gradient-to-br from-[#2E4CA6]/10 to-[#0477BF]/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Star className="h-10 w-10 text-[#2E4CA6]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-[#2E4CA6]">
                    Calidad Garantizada
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Elige entre diferentes tipos de servicio y califica a tu
                    conductor para ayudarnos a mantener la calidad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Driver CTA Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-br from-[#2E4CA6] via-[#0477BF] to-[#049DD9] text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#2E4CA6]/90 to-[#049DD9]/90"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#05C7F2]/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#049DD9]/10 rounded-full blur-3xl"></div>
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 font-headline">
              ¿Eres Conductor? Únete a Nosotros
            </h2>
            <p className="text-lg lg:text-xl max-w-3xl mx-auto mb-8 text-gray-100 leading-relaxed">
              Sé tu propio jefe, elige tus horarios y maximiza tus ganancias.
              Ofrecemos comisiones bajas y un modelo de suscripción flexible.
            </p>
            <Button
              asChild
              size="lg"
              className="font-bold text-lg px-10 py-6 bg-white text-[#2E4CA6] hover:bg-[#F2F2F2] hover:text-[#0477BF] border-0 shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <Link href="/driver">Conviértete en Conductor</Link>
            </Button>
          </div>
        </section>
      </main>
    </>
  );
}
