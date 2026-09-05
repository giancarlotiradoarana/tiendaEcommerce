# 👑 Aroma de Reyes

Tienda online de perfumes árabes + sistema de punto de venta (POS) y gestión para tienda física.
Envíos a todo el Perú con pago contra entrega.

> Sistema desarrollado por **Ing. Giancarlo Tirado Arana**

---

## 🔑 Credenciales de acceso

Panel: **http://localhost:3000/panel**

| Rol | Correo | Contraseña | Acceso |
|-----|--------|-----------|--------|
| **Administrador** | `admin@aroma.pe` | `admin123` | Supervisión y gestión total |
| **Vendedor** | `vendedor@aroma.pe` | `vendedor123` | POS, caja y operación de mostrador |

> ⚠️ **Cambia estas contraseñas antes de publicar la tienda.** Son de prueba.

---

## 🌐 URLs

| Qué es | URL |
|--------|-----|
| Tienda (clientes) | http://localhost:3000 |
| Panel / Login | http://localhost:3000/panel |

La URL raíz es inteligente: sin sesión muestra la tienda; con sesión redirige al panel
según el rol (admin → dashboard, vendedor → punto de venta).

---

## 🚀 Cómo ejecutar el proyecto

Requisitos: **Node.js 18+** y **npm**.

```bash
# 1. Instalar dependencias (solo la primera vez)
npm install

# 2. Preparar la base de datos (solo la primera vez)
npx prisma db push
npx prisma db seed

# 3. Arrancar en modo desarrollo
npm run dev
```

Abre **http://localhost:3000**

### Otros comandos
```bash
npm run build       # Compilar para producción
npm start           # Ejecutar versión de producción
npx prisma studio   # Ver/editar la base de datos
```

---

## ✨ Funcionalidades

### 🛒 Tienda (clientes)
- Catálogo de perfumes con fotos, notas olfativas, precios y ofertas.
- Carrito y checkout con **pago contra entrega**.
- Datos de envío en cascada: **Departamento → Provincia → Distrito**.
- Validaciones: nombre solo letras, celular de 9 dígitos que empieza con 9.
- El formulario se limpia al confirmar el pedido.

### 🧑‍💼 Panel — Vendedor (operación de mostrador)
- **Dashboard**: ventas del turno, estado de caja, desglose por canal, stock bajo.
- **Punto de Venta (POS)**:
  - Buscar o **escanear productos con pistola de código de barras**.
  - Carrito, IGV automático, descuento manual.
  - **Cliente**: registrar celular del comprador (se guarda para recompra).
  - **Cupón**: aplicar código de descuento en la venta física.
  - Métodos de pago (efectivo, tarjeta, Yape, Plin, transferencia), vuelto.
  - **Comprobante imprimible** (ticket/boleta/nota) con logo.
- **Caja**: abrir/cerrar con arqueo, movimientos, desglose por método de pago.
- **Ventas**: historial con filtros (fecha, canal, búsqueda), paginación,
  **reimprimir comprobante** y **anular venta** (devuelve stock).
- **Pedidos Web**: gestión de estados de pedidos.
- **Productos**: consulta de stock + **solicitar reabastecimiento** al admin.

### 👑 Panel — Administrador (supervisión y gestión)
> El admin NO opera POS ni caja (solo supervisa). Su menú:

**General**
- **Dashboard**: métricas + gráficos (línea de ventas 7 días, dona por canal, barras top productos).

**Ventas**
- **Ventas**: todas las ventas (físicas y web) con filtros, exportar y anular.
- **Pedidos Web**: gestión de pedidos de la tienda online.

**Catálogo**
- **Productos**: crear/editar/eliminar, costo, SKU, generar código de barras e imprimir etiquetas.
- **Categorías / Marcas**: organizar el catálogo.

**Inventario**
- **Proveedores**: registro de proveedores.
- **Compras**: registrar mercadería → sube stock automáticamente y actualiza costo.
- **Kardex**: historial de movimientos de inventario (entradas, salidas, ajustes) + ajuste manual.
- **Reabastecimiento**: solicitudes de stock enviadas por el vendedor.

**Marketing**
- **Clientes**: base de clientes con botón directo de WhatsApp para recompra.
- **Cupones**: crear descuentos (% o monto) con mínimo, límite de usos y vencimiento.

**Administración**
- **Reportes**: ventas por día/mes, canal, método de pago, top productos, por vendedor. Exportables.
- **Historial de Cajas**: aperturas/cierres/arqueos de todos los vendedores. Exportable.
- **Usuarios**: crear, **editar** (nombre, correo, rol, contraseña) y eliminar.
- **Configuración**: nombre de tienda, IGV, envíos, número de notificaciones,
  **logo** y **sonido** de notificación (ambos configurables desde la interfaz).

### 🔔 Notificaciones de nuevos pedidos
- **En el panel**: aviso visual + **sonido en tiempo real** (SSE) apenas entra el pedido.
- El sonido se configura desde el panel (Configuración → subir audio).
- **Push del sistema** (tipo Shopify): al celular/PC (requiere HTTPS en producción).
- **WhatsApp** (opcional): listo para conectar con WhatsApp Cloud API.

### 📦 Código de barras
- Cada producto puede tener un **Código / SKU**.
- Escaneo con pistola en el POS (funciona como teclado + Enter).
- Botón **"Generar"** crea códigos únicos; botón **"Etiqueta"** imprime el código de barras.

### 📤 Exportaciones (Excel .xlsx con diseño + PDF con logo)
Disponibles en: Ventas, Caja, Pedidos Web, Productos, Reportes e Historial de Cajas.

---

## 🧾 Datos de ejemplo (seed)

`npx prisma db seed` crea: 6 perfumes, usuario admin y vendedor, y la configuración inicial.

---

## 🛠️ Stack técnico

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Prisma** + **SQLite** (migrable a PostgreSQL en producción)
- **NextAuth** (autenticación con roles)
- **Tailwind CSS** + **Lucide** (íconos) + **Recharts** (gráficos)
- **ExcelJS** (Excel) · **JsBarcode** (códigos de barras) · **web-push** (push)

---

## ⚙️ Variables de entorno (`.env`)

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="..."          # Cambiar en producción por uno aleatorio largo
NEXTAUTH_URL="http://localhost:3000"
NOTIFY_PHONE="51943085507"     # Número para notificaciones (fallback)
WHATSAPP_TOKEN=""              # Opcional: WhatsApp Cloud API
WHATSAPP_PHONE_ID=""
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."  # Notificaciones push web
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:admin@aroma.pe"
```

---

## 📌 Notas importantes

- **En desarrollo** (`npm run dev`) la primera carga de cada página tarda unos
  segundos por la compilación. En producción es instantáneo.
- El **IGV (18%)** está incluido en el precio y se desglosa automáticamente.
- Las **ventas web** se registran como venta solo cuando el pedido pasa a **ENTREGADO**
  (dinero realmente cobrado en contraentrega).
- La **caja es individual por usuario**: cada vendedor abre y cuadra la suya.
- El **stock** sube con Compras, baja con Ventas, y se corrige con ajustes (todo queda en el Kardex).
- Los comprobantes son **para control interno**, no son comprobantes electrónicos
  válidos ante SUNAT (eso requiere integrar un OSE/PSE con certificado digital).
- Para producción: cambiar contraseñas, el `NEXTAUTH_SECRET`, y migrar a PostgreSQL.
