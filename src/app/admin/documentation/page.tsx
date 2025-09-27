
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CircleDollarSign, AlertTriangle, CalendarDays, BrainCircuit, Bot } from 'lucide-react';

export default function AdminDocumentationPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <h1 className="text-2xl font-bold sm:text-3xl font-headline">
            Documentación del Sistema
          </h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bienvenido al Panel de Administración de Hello Taxi</CardTitle>
          <CardDescription>
            Esta guía sirve como referencia central para entender el funcionamiento interno de la plataforma,
            las reglas de negocio y cómo la inteligencia artificial nos ayuda a operar.
          </CardDescription>
        </CardHeader>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Lógica de Cálculo de Tarifas</CardTitle>
            <CardDescription>
                El corazón de nuestro negocio es un sistema de precios transparente y predecible.
                Aquí se desglosa cómo se calcula la tarifa para cada viaje.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-lg font-semibold">
                        Paso 1: El Núcleo de la Tarifa
                    </AccordionTrigger>
                    <AccordionContent className="text-base space-y-4 pt-4">
                        <p>El costo inicial de cualquier viaje se compone de tres elementos fundamentales. Esta es la base sobre la que se construye el precio final.</p>
                        <div className="p-4 bg-muted rounded-lg">
                            <code className="text-sm md:text-base font-semibold">
                                Costo Base del Viaje = Tarifa Base + (Costo por Distancia) + (Costo por Duración)
                            </code>
                        </div>
                        <ul className="list-disc list-inside space-y-2">
                            <li><span className="font-semibold">Tarifa Base:</span> Un monto fijo que se cobra al iniciar cualquier viaje. Cubre costos operativos básicos.</li>
                            <li><span className="font-semibold">Costo por Distancia:</span> Los kilómetros totales del viaje multiplicados por la tarifa por kilómetro.</li>
                            <li><span className="font-semibold">Costo por Duración:</span> Los minutos totales del viaje multiplicados por la tarifa por minuto. Aquí es donde el tráfico impacta directamente el precio.</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                    <AccordionTrigger className="text-lg font-semibold">
                        Paso 2: Multiplicador por Tipo de Servicio
                    </AccordionTrigger>
                    <AccordionContent className="text-base space-y-4 pt-4">
                        <p>Ofrecemos diferentes niveles de servicio, cada uno con un costo asociado. El multiplicador se aplica sobre el núcleo de la tarifa para calcular este costo adicional.</p>
                         <div className="p-4 bg-muted rounded-lg">
                            <code className="text-sm md:text-base font-semibold">
                                Costo del Servicio = (Costo Base del Viaje) * (Multiplicador - 1)
                            </code>
                        </div>
                        <div>Por ejemplo, si el "Costo Base del Viaje" es S/10 y el multiplicador del servicio "Confort" es <Badge variant="outline">1.5</Badge>, el costo adicional del servicio será de S/5.</div>
                    </AccordionContent>
                </AccordionItem>

                 <AccordionItem value="item-3">
                    <AccordionTrigger className="text-lg font-semibold">
                        Paso 3: Factores Dinámicos y Recargos
                    </AccordionTrigger>
                    <AccordionContent className="text-base space-y-4 pt-4">
                        <p>El sistema aplica recargos porcentuales sobre el subtotal acumulado basándose en reglas de negocio que puedes configurar en los <span className="font-semibold">Ajustes</span>.</p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center gap-2">
                                    <AlertTriangle className="h-6 w-6 text-orange-500" />
                                    <CardTitle>Recargo por Hora Punta</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p>Si la hora de solicitud del viaje cae dentro de un rango definido como "hora punta" (ej: 4pm - 7pm), se aplica el porcentaje de recargo configurado.</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center gap-2">
                                    <CalendarDays className="h-6 w-6 text-blue-500" />
                                    <CardTitle>Recargo por Tarifa Especial</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p>Si la fecha del viaje corresponde a un evento o feriado (ej: Navidad, Fiestas Patrias), se aplica el recargo definido para esa regla.</p>
                                </CardContent>
                            </Card>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                 <AccordionItem value="item-4">
                    <AccordionTrigger className="text-lg font-semibold">
                        Paso 4: Descuentos y Fórmula Final
                    </AccordionTrigger>
                    <AccordionContent className="text-base space-y-4 pt-4">
                        <p>Finalmente, si se aplica un cupón de promoción válido, su valor (fijo o porcentual) se resta del total.</p>
                        <div className="p-4 border-2 border-primary/50 rounded-lg text-center bg-primary/5">
                            <p className="font-bold text-lg mb-2">Fórmula Final Consolidada</p>
                            <code className="text-sm md:text-base font-semibold text-primary">
                                Tarifa Total = (Subtotal + Recargos) - Descuento
                            </code>
                        </div>
                         <p className="text-muted-foreground mt-4">
                            Esta tarifa final es la que se le presenta al usuario como el "precio sugerido" al inicio del proceso de negociación, sirviendo como un ancla justa y transparente.
                        </p>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardContent>
      </Card>

      <Card>
         <CardHeader>
            <CardTitle>El Rol de la Inteligencia Artificial</CardTitle>
            <CardDescription>
                La IA está integrada en varios procesos clave para mejorar la eficiencia y la experiencia del usuario.
            </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
                <BrainCircuit className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                    <h3 className="font-semibold text-lg">Estimación de Tarifa (IA)</h3>
                    <p className="text-muted-foreground">Actúa como un "experto externo". Estima la tarifa basándose en su conocimiento general, sin seguir nuestra fórmula interna. Sirve como un validador para asegurar que nuestros precios son competitivos y justos.</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <Bot className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                    <h3 className="font-semibold text-lg">Negociación de Tarifa</h3>
                    <p className="text-muted-foreground">Simula a un conductor que recibe la propuesta del pasajero. Su objetivo es aceptar ofertas justas o proponer contraofertas razonables, dentro de los márgenes que el sistema le permite.</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <Bot className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                    <h3 className="font-semibold text-lg">Asistente de Soporte (Chat)</h3>
                    <p className="text-muted-foreground">Responde a las preguntas frecuentes de los usuarios sobre el uso de la aplicación, basándose en la información clave del negocio que le hemos proporcionado.</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <BrainCircuit className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div>
                    <h3 className="font-semibold text-lg">Asistente de Reclamos</h3>
                    <p className="text-muted-foreground">Analiza el motivo y los detalles de un reclamo de un usuario y genera un borrador de respuesta y plan de acción para el administrador, agilizando la resolución de casos.</p>
                </div>
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
