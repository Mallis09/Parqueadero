// Variable global para almacenar el total pendiente
let cuentaPendiente = 0;

// Enlaces a los nodos del DOM
const domTarget = {
    tipo: document.getElementById("selectTipo"),
    placa: document.getElementById("inputPlaca"),
    ingreso: document.getElementById("horaIngreso"),
    salida: document.getElementById("horaSalida"),
    efectivo: document.getElementById("montoEfectivo"),
    consola: document.getElementById("panelConsola"),
    btnCalcular: document.getElementById("actionCalcular"),
    btnPagar: document.getElementById("actionPagar")
};

// Escuchadores de eventos corporativos
domTarget.btnCalcular.addEventListener("click", () => procesarAuditoria());
domTarget.btnPagar.addEventListener("click", () => ejecutarTransaccion());

// Validadores con expresiones regulares alternativas
const comprobarNomenclatura = (texto, categoria) => {
    const patronAuto = /^[A-Z]{3}\d{3}$/;
    const patronMoto = /^[A-Z]{3}\d{2}[A-Z]$/;
    return categoria === "Automovil" ? patronAuto.test(texto) : patronMoto.test(texto);
};

// Utilidades cronológicas y matemáticas
const obtenerDiferenciaMinutos = (t1, t2) => Math.floor((t2 - t1) / 60000);

const extraerDigitoTerminal = (idPlaca) => {
    const digitos = idPlaca.match(/\d/g);
    return digitos ? parseInt(digitos[digitos.length - 1]) : null;
};

// Reglas de restricción vehicular (Pico y Placa)
const verificarRestriccion = (fechaObjeto, digito) => {
    const diaSemana = fechaObjeto.getDay();
    const mapaDias = [[9,0], [1,2], [3,4], [5,6], [7,8], []]; // Domingo index 0, Lunes 1...
    return mapaDias[diaSemana]?.includes(digito) || false;
};

// Redondeo comercial superior a 50
const redondearTarifa = (monto) => Math.ceil(monto / 50) * 50;

// Algoritmo de desglose de efectivo (Arqueo)
const desglozarCambio = (montoCambio) => {
    const unidadesMonetarias = [50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50];
    let mapaSalida = [];

    unidadesMonetarias.forEach(denominacion => {
        const cantidad = Math.floor(montoCambio / denominacion);
        if (cantidad > 0) {
            mapaSalida.push(`✨ <b>${cantidad}</b> billete/s de $${denominacion}`);
            montoCambio %= denominacion;
        }
    });
    return mapaSalida.join("<br>");
};

// Orquestador 1: Liquidar Cuenta
function procesarAuditoria() {
    const { consola, tipo, placa, ingreso, salida } = domTarget;
    
    // Limpiamos por completo las clases de error y contenido previo antes de validar
    consola.classList.remove("alert-danger");
    consola.innerHTML = ""; 

    try {
        const strPlaca = placa.value.trim().toUpperCase();
        const dateIngreso = new Date(ingreso.value);
        const dateSalida = new Date(salida.value);

        if (!comprobarNomenclatura(strPlaca, tipo.value)) throw "El formato de la matrícula ingresada es incorrecto.";
        if (isNaN(dateIngreso.getTime()) || isNaN(dateSalida.getTime())) throw "Por favor especifique ambas marcas de tiempo.";
        if (dateSalida <= dateIngreso) throw "La hora de salida no puede ser previa o igual al ingreso.";

        const lapsoMinutos = obtenerDiferenciaMinutos(dateIngreso, dateSalida);
        let costoBase = tipo.value === "Automovil" ? lapsoMinutos * 110 : lapsoMinutos * 80;

        if (tipo.value === "Automovil") {
            const numFinal = extraerDigitoTerminal(strPlaca);
            if (verificarRestriccion(dateIngreso, numFinal)) {
                costoBase *= 0.75; // Deducción del 25% por restricción
            }
        }

        cuentaPendiente = redondearTarifa(costoBase);

        consola.innerHTML = `
            🔹 <b>Resumen de Estancia:</b> ${lapsoMinutos} minutos.<br>
            💸 <b>Total Neto a pagar:</b> $${cuentaPendiente}
        `;

    } catch (errorMensaje) {
        cuentaPendiente = 0;
        consola.classList.add("alert-danger");
        consola.innerHTML = `⚠️ <b>Error del sistema:</b> ${errorMensaje}`;
    }
}

// Orquestador 2: Realizar el Pago
function ejecutarTransaccion() {
    const { consola, efectivo } = domTarget;

    try {
        if (cuentaPendiente === 0) throw "No se registra ninguna liquidación activa para procesar.";
        
        const abono = parseInt(efectivo.value);

        if (isNaN(abono)) throw "Por favor introduzca una cantidad numérica válida de dinero.";
        if (abono < cuentaPendiente) throw `Fondos insuficientes. El saldo requerido es de $${cuentaPendiente}.`;

        const sobrante = abono - cuentaPendiente;

        consola.innerHTML += `
            <hr style="margin:12px 0; border:0; border-top:1px dashed #ebdcd5;">
            ✅ <b>Transacción Exitosa</b><br>
            📥 Entregado: $${abono}<br>
            📤 Su cambio total: $${sobrante}<br><br>
            <b>Desglose de entrega:</b><br>${desglozarCambio(sobrante) || "Sin excedente."}
        `;

    } catch (errorPago) {
        consola.classList.add("alert-danger");
        consola.innerHTML = `⚠️ <b>Error en caja:</b> ${errorPago}`;
    }
}