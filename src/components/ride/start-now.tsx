"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Clock,
  Shield,
  Star,
  Wallet,
  MapPin,
  Navigation,
  Users,
  Car,
  Zap,
  Award,
  TrendingUp,
  Sparkles,
  CircleDollarSign,
  Gauge,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

const StartNow = () => {
  const [selectedCar, setSelectedCar] = useState(0);

  // Animación de partículas flotantes
  const floatingIcons = [
    { Icon: MapPin, delay: 0, x: "10%", y: "20%" },
    { Icon: Car, delay: 0.2, x: "80%", y: "15%" },
    { Icon: Navigation, delay: 0.4, x: "20%", y: "70%" },
    { Icon: Users, delay: 0.6, x: "85%", y: "75%" },
    { Icon: Sparkles, delay: 0.8, x: "50%", y: "50%" },
  ];

  // Tipos de vehículos
  const vehicles = [
    {
      name: "SUV Premium",
      image: "/img/suv.png",
      capacity: "6 pasajeros",
      price: "Desde S/ 10",
      features: ["Amplio espacio", "Aire acondicionado", "Música premium"],
      gradient: "from-[#2E4CA6] to-[#0477BF]",
      description: "Máximo confort para grupos grandes",
    },
    {
      name: "Sedán Confort",
      image: "/img/sedan.png",
      capacity: "4 pasajeros",
      price: "Desde S/ 8",
      features: ["Confortable", "Elegante", "Perfecto para ciudad"],
      gradient: "from-[#0477BF] to-[#049DD9]",
      description: "La opción perfecta para tu día a día",
    },
    {
      name: "Hatchback Económico",
      image: "/img/hatchback.png",
      capacity: "4 pasajeros",
      price: "Desde S/ 6",
      features: ["Económico", "Rápido", "Ideal para cortas distancias"],
      gradient: "from-[#049DD9] to-[#05C7F2]",
      description: "Viaja ligero y ahorra",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 to-background overflow-hidden">
      {/* Hero Section con CTA principal */}
      <section className="relative py-16 md:py-10 bg-gradient-to-br from-[#2E4CA6] via-[#0477BF] to-[#049DD9] text-white text-center overflow-hidden">
        {/* Fondo animado con partículas */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {floatingIcons.map(({ Icon, delay, x, y }, index) => (
            <motion.div
              key={index}
              className="absolute text-white/10"
              style={{ left: x, top: y }}
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              animate={{
                opacity: [0.1, 0.3, 0.1],
                scale: [1, 1.5, 1],
                rotate: [0, 180, 360],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 6,
                delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Icon size={48} />
            </motion.div>
          ))}
        </div>

        {/* Patrón de cuadrícula animado */}
        <motion.div
          className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <div className="container mx-auto px-4 relative z-10">

          <motion.h1
            className="text-4xl md:text-6xl font-bold font-headline mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Tu próxima forma de{" "}
            <motion.span
              className="inline-block bg-gradient-to-r from-[#05C7F2] to-white bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ["0%", "100%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              viajar
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Con HelloTaxi viajas rápido, seguro y con la tarifa más justa.
            Conéctate en segundos con conductores cercanos y disfruta la
            experiencia.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              asChild
              size="lg"
              className="px-10 py-6 text-lg font-semibold shadow-2xl bg-white text-[#2E4CA6] hover:bg-[#05C7F2] hover:text-white transition-all duration-300 group"
            >
              <Link href="/login">
                <MapPin className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                Comenzar Ahora
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </Button>
          </motion.div>

        </div>
      </section>

      {/* Sección de Vehículos Premium - ULTRA LLAMATIVA */}
      <section className="py-20 bg-gradient-to-br from-[#F2F2F2] via-white to-[#F2F2F2] relative overflow-hidden">
        {/* Fondo animado con ondas */}
        <motion.div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, #2E4CA6 0%, transparent 50%), radial-gradient(circle at 80% 80%, #049DD9 0%, transparent 50%)",
          }}
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          {/* Título animado */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2E4CA6] to-[#049DD9] text-white px-6 py-2 rounded-full mb-4"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(4, 119, 191, 0.3)",
                  "0 0 40px rgba(4, 157, 217, 0.5)",
                  "0 0 20px rgba(4, 119, 191, 0.3)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            >
              <Car className="h-5 w-5" />
              <span className="font-semibold">Nuestra Flota</span>
              <Sparkles className="h-5 w-5 animate-pulse" />
            </motion.div>

            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-[#2E4CA6] via-[#0477BF] to-[#049DD9] bg-clip-text text-transparent">
                Elige tu vehículo ideal
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tenemos el auto perfecto para cada ocasión. Desde económicos hasta
              premium.
            </p>
          </motion.div>

          {/* Selector de vehículos con animaciones impresionantes */}
          <div className="max-w-6xl mx-auto">
            {/* Miniaturas de selección */}
            <div className="flex justify-center gap-4 mb-12">
              {vehicles.map((vehicle, index) => (
                <motion.button
                  key={index}
                  onClick={() => setSelectedCar(index)}
                  className={`relative p-4 rounded-2xl transition-all duration-300 ${
                    selectedCar === index
                      ? "bg-gradient-to-br from-[#2E4CA6] to-[#049DD9] shadow-2xl"
                      : "bg-white border-2 border-gray-200 hover:border-[#049DD9]"
                  }`}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <motion.div
                    className="relative w-20 h-20"
                    animate={
                      selectedCar === index
                        ? {
                            rotateY: [0, 360],
                          }
                        : {}
                    }
                    transition={{ duration: 1 }}
                  >
                    <Image
                      src={vehicle.image}
                      alt={vehicle.name}
                      fill
                      className="object-contain"
                    />
                  </motion.div>
                  {selectedCar === index && (
                    <motion.div
                      className="absolute -top-2 -right-2 bg-[#05C7F2] rounded-full p-1"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: 360 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      <Sparkles className="h-4 w-4 text-white" />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Vehículo seleccionado - Display principal */}
            <motion.div
              key={selectedCar}
              initial={{ opacity: 0, x: 100, rotateY: -90 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -100, rotateY: 90 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="relative"
            >
              <Card className="overflow-hidden border-0 shadow-2xl">
                <div
                  className={`bg-gradient-to-br ${vehicles[selectedCar].gradient} p-8 md:p-12`}
                >
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    {/* Imagen del vehículo con animación */}
                    <motion.div
                      className="relative"
                      initial={{ x: -100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                    >
                      <motion.div
                        className="relative w-full h-64 md:h-80"
                        animate={{
                          y: [0, -20, 0],
                          rotateZ: [0, 2, 0, -2, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Image
                          src={vehicles[selectedCar].image}
                          alt={vehicles[selectedCar].name}
                          fill
                          className="object-contain drop-shadow-2xl"
                          priority
                        />
                      </motion.div>

                      {/* Efecto de brillo animado */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{
                          x: ["-100%", "100%"],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 3,
                        }}
                      />
                    </motion.div>

                    {/* Información del vehículo */}
                    <motion.div
                      className="text-white space-y-6"
                      initial={{ x: 100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div>
                        <motion.h3
                          className="text-4xl font-bold mb-2"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          {vehicles[selectedCar].name}
                        </motion.h3>
                        <p className="text-white/90 text-lg">
                          {vehicles[selectedCar].description}
                        </p>
                      </div>

                      {/* Precio destacado */}
                      <motion.div
                        className="bg-white/20 backdrop-blur-md rounded-2xl p-4 inline-block"
                        whileHover={{ scale: 1.05 }}
                        animate={{
                          boxShadow: [
                            "0 0 20px rgba(255,255,255,0.2)",
                            "0 0 40px rgba(255,255,255,0.4)",
                            "0 0 20px rgba(255,255,255,0.2)",
                          ],
                        }}
                        transition={{
                          boxShadow: {
                            duration: 2,
                            repeat: Infinity,
                          },
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <CircleDollarSign className="h-6 w-6" />
                          <span className="text-2xl font-bold">
                            {vehicles[selectedCar].price}
                          </span>
                        </div>
                      </motion.div>

                      {/* Características con iconos */}
                      <div className="space-y-3">
                        <motion.div
                          className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3"
                          whileHover={{
                            x: 10,
                            backgroundColor: "rgba(255,255,255,0.2)",
                          }}
                        >
                          <Users className="h-5 w-5 text-[#05C7F2]" />
                          <span className="font-medium">
                            {vehicles[selectedCar].capacity}
                          </span>
                        </motion.div>

                        {vehicles[selectedCar].features.map((feature, idx) => (
                          <motion.div
                            key={idx}
                            className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + idx * 0.1 }}
                            whileHover={{
                              x: 10,
                              backgroundColor: "rgba(255,255,255,0.2)",
                            }}
                          >
                            <Sparkles className="h-5 w-5 text-[#05C7F2]" />
                            <span>{feature}</span>
                          </motion.div>
                        ))}
                      </div>

                      {/* Botón de acción */}
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          asChild
                          size="lg"
                          className="w-full bg-white text-[#2E4CA6] hover:bg-[#05C7F2] hover:text-white font-bold text-lg py-6 shadow-2xl group"
                        >
                          <Link href="/login">
                            <Car className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                            Solicitar {vehicles[selectedCar].name}
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                          </Link>
                        </Button>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>

                {/* Barra de estadísticas en la parte inferior */}
                <motion.div
                  className="bg-white p-6"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <motion.div
                      whileHover={{ y: -5 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-[#2E4CA6]/10 to-[#0477BF]/10"
                    >
                      <Gauge className="h-8 w-8 mx-auto mb-2 text-[#0477BF]" />
                      <div className="font-bold text-lg text-[#2E4CA6]">
                        Rápido
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Llegada inmediata
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -5 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-[#049DD9]/10 to-[#05C7F2]/10"
                    >
                      <Shield className="h-8 w-8 mx-auto mb-2 text-[#049DD9]" />
                      <div className="font-bold text-lg text-[#0477BF]">
                        Seguro
                      </div>
                      <div className="text-sm text-muted-foreground">
                        100% verificado
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -5 }}
                      className="p-4 rounded-xl bg-gradient-to-br from-[#05C7F2]/10 to-[#049DD9]/10"
                    >
                      <UserCheck className="h-8 w-8 mx-auto mb-2 text-[#05C7F2]" />
                      <div className="font-bold text-lg text-[#049DD9]">
                        Confiable
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Mejor calificación
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </Card>
            </motion.div>
          </div>

          {/* Indicadores de características adicionales */}
          <motion.div
            className="grid md:grid-cols-3 gap-6 mt-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {[
              {
                icon: Clock,
                title: "Disponibilidad 24/7",
                description:
                  "Solicita un vehículo en cualquier momento del día",
                color: "from-[#2E4CA6] to-[#0477BF]",
              },
              {
                icon: Award,
                title: "Vehículos Premium",
                description: "Flota moderna y en perfectas condiciones",
                color: "from-[#0477BF] to-[#049DD9]",
              },
              {
                icon: Sparkles,
                title: "Experiencia Única",
                description: "Viaja con estilo y comodidad garantizada",
                color: "from-[#049DD9] to-[#05C7F2]",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Card className="text-center p-6 border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white">
                  <motion.div
                    className={`h-16 w-16 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <item.icon className="h-8 w-8 text-white" />
                  </motion.div>
                  <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Partículas decorativas de autos flotantes */}
        <motion.div
          className="absolute top-20 left-10 text-[#049DD9]/5 pointer-events-none"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Car size={120} />
        </motion.div>
        <motion.div
          className="absolute bottom-20 right-10 text-[#2E4CA6]/5 pointer-events-none"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Navigation size={100} />
        </motion.div>
      </section>

      {/* Beneficios */}
      <section className="py-16 bg-background border-b relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-[#2E4CA6] to-[#049DD9] bg-clip-text text-transparent">
              ¿Por qué elegirnos?
            </h2>
            <p className="text-center text-muted-foreground mb-10">
              Descubre los beneficios que hacen de HelloTaxi tu mejor opción
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Shield,
                title: "Seguridad",
                description:
                  "Conductores verificados y soporte 24/7 para tu tranquilidad.",
                gradient: "from-[#2E4CA6] to-[#0477BF]",
                delay: 0,
              },
              {
                icon: Zap,
                title: "Rapidez",
                description:
                  "Pide un taxi en segundos y llega a tu destino sin complicaciones.",
                gradient: "from-[#0477BF] to-[#049DD9]",
                delay: 0.1,
              },
              {
                icon: Award,
                title: "Calidad",
                description:
                  "Conductores con las mejores valoraciones y experiencia de servicio.",
                gradient: "from-[#049DD9] to-[#05C7F2]",
                delay: 0.2,
              },
              {
                icon: Wallet,
                title: "Pagos fáciles",
                description: "Paga con billetera electrónica o efectivo.",
                gradient: "from-[#05C7F2] to-[#049DD9]",
                delay: 0.3,
              },
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: benefit.delay }}
                whileHover={{
                  y: -10,
                  transition: { duration: 0.3 },
                }}
              >
                <Card className="text-center border-[#049DD9]/20 shadow-md hover:shadow-2xl transition-all duration-300 h-full group">
                  <CardContent className="pt-6">
                    <motion.div
                      className={`h-16 w-16 rounded-full bg-gradient-to-br ${benefit.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl`}
                      whileHover={{
                        rotate: 360,
                        scale: 1.1,
                      }}
                      transition={{ duration: 0.6 }}
                    >
                      <benefit.icon className="h-8 w-8 text-white" />
                    </motion.div>
                    <h3 className="font-semibold mb-2 text-lg group-hover:text-[#0477BF] transition-colors">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Iconos decorativos flotantes en el fondo */}
        <motion.div
          className="absolute top-10 right-10 text-[#049DD9]/10"
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Navigation size={64} />
        </motion.div>
        <motion.div
          className="absolute bottom-10 left-10 text-[#2E4CA6]/10"
          animate={{
            rotate: -360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <MapPin size={80} />
        </motion.div>
      </section>
    </div>
  );
};

export default StartNow;
