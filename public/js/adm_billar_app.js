let mesas = JSON.parse(localStorage.getItem("mesas")) || [];
        let tarifaPorHora = parseFloat(localStorage.getItem("tarifa")) || 20; // Cobro por hora
        let soundEnabled = localStorage.getItem("soundEnabled") !== "false";

        function guardarDatos() {
            localStorage.setItem("mesas", JSON.stringify(mesas));
            localStorage.setItem("tarifa", tarifaPorHora);
            localStorage.setItem("soundEnabled", soundEnabled);
        }

        function formatTime(minutos) {
            const totalSegundos = Math.floor(minutos * 60);
            const horas = Math.floor(totalSegundos / 3600);
            const mins = Math.floor((totalSegundos % 3600) / 60);
            const segs = totalSegundos % 60;
            return `${horas}h ${mins}m ${segs}s`;
        }

        function mostrarNotificacion(mensaje) {
            const notificacion = document.createElement('div');
            notificacion.className = 'notificacion';
            notificacion.innerHTML = `
        <span>${mensaje}</span>
        <button onclick="this.parentElement.remove()" class="btn-danger">×</button>
      `;

            document.getElementById('notificaciones').appendChild(notificacion);
            if (soundEnabled) document.getElementById('alertaSonido').play().catch(() => { });
            setTimeout(() => notificacion.remove(), 5000);
        }

        function calcularTiempoUsado(mesa) {
            return mesa.running ? ((Date.now() - mesa.inicio) / 60000) + mesa.tiempoTotal : mesa.tiempoTotal;
        }

        function calcularTotal(mesa) {
            const tiempoUsadoHoras = calcularTiempoUsado(mesa) / 60;
            const extrasTotal = mesa.extras.reduce((acc, e) => acc + e.valor, 0);
            return (tiempoUsadoHoras * tarifaPorHora) + extrasTotal;
        }

        function actualizarResumen() {
            document.getElementById('totalMesas').textContent = mesas.length;
            document.getElementById('mesasActivas').textContent = mesas.filter(m => m.running).length;
            document.getElementById('ingresosTotales').textContent =
                `$${mesas.reduce((acc, m) => acc + calcularTotal(m), 0).toFixed(2)}`;
        }

        function renderMesas() {
            const container = document.getElementById("mesasContainer");
            container.innerHTML = "";

            mesas.forEach((mesa, index) => {
                const tiempoUsado = calcularTiempoUsado(mesa);
                const total = calcularTotal(mesa);
                const clase = `mesa ${mesa.running ? 'running' : ''} ${mesa.expirada ? 'expirada' : ''}`;

                const mesaHTML = `
          <div class="${clase}">
            <div class="mesa-header">
              <h2>🎱 Mesa ${index + 1}</h2>
              <div><strong>$${total.toFixed(2)}</strong></div>
            </div>
            <div><strong>🕒 Tiempo:</strong> ${formatTime(tiempoUsado)}</div>
            <div><strong>➕ Extras:</strong></div>
            <ul class="extras-list">
              ${mesa.extras.map(e => `
                <li>
                  <span>${e.nombre}</span>
                  <span>$${e.valor.toFixed(2)}</span>
                </li>
              `).join('')}
            </ul>
  
            <div class="input-group">
              <input type="text" placeholder="Nombre extra" id="extraNombre${index}">
              <input type="number" placeholder="Valor" id="extraValor${index}" min="0" step="0.01">
            </div>
  
            <div class="input-group">
              <input type="number" 
                     id="temporizador${index}" 
                     value="${mesa.temporizador ?? ''}" 
                     placeholder="Temporizador (min)" 
                     min="0"
                     onchange="actualizarTemporizador(${index})">
            </div>
  
            <div class="controls">
              ${mesa.running ? `
                <button class="btn-danger" onclick="detener(${index})">⏹ Detener</button>
              ` : `
                <button class="btn-success" onclick="iniciar(${index})">▶ Iniciar</button>
              `}
              <button class="btn-warning" onclick="agregarExtra(${index})">➕ Extra</button>
              <button class="btn-danger" onclick="eliminarMesa(${index})">🗑 Eliminar</button>
              <button class="btn-primary" onclick="resetearMesa(${index})">🔄 Resetear</button>
              <button onclick="imprimir(${index})">🖨 Imprimir</button>
            </div>
          </div>
        `;
                container.innerHTML += mesaHTML;
            });

            actualizarResumen();
            guardarDatos();
        }

        function iniciar(index) {
            if (!mesas[index].running) {
                mesas[index].inicio = Date.now();
                mesas[index].running = true;
                mesas[index].expirada = false;
                renderMesas();
            }
        }

        function detener(index) {
            if (mesas[index].running) {
                mesas[index].tiempoTotal += (Date.now() - mesas[index].inicio) / 60000;
                mesas[index].running = false;
                mesas[index].inicio = null;
                renderMesas();
            }
        }

        function resetearMesa(index) {
            if (confirm(`¿Resetear mesa ${index + 1}? Se borrará todo el tiempo y extras.`)) {
                mesas[index].inicio = null;
                mesas[index].tiempoTotal = 0;
                mesas[index].extras = [];
                mesas[index].running = false;
                mesas[index].expirada = false;
                mesas[index].temporizador = null;
                renderMesas();
            }
        }

        function agregarExtra(index) {
            const nombre = document.getElementById(`extraNombre${index}`).value.trim();
            const valor = parseFloat(document.getElementById(`extraValor${index}`).value);

            if (nombre && !isNaN(valor) && valor >= 0) {
                mesas[index].extras.push({ nombre, valor });
                document.getElementById(`extraNombre${index}`).value = '';
                document.getElementById(`extraValor${index}`).value = '';
                renderMesas();
            }
        }

        function eliminarMesa(index) {
            if (confirm(`¿Eliminar mesa ${index + 1}?`)) {
                mesas.splice(index, 1);
                renderMesas();
                mostrarNotificacion(`Mesa ${index + 1} eliminada`);
            }
        }

        function actualizarTemporizador(index) {
            const valor = parseFloat(document.getElementById(`temporizador${index}`).value);
            mesas[index].temporizador = isNaN(valor) ? null : Math.max(0, valor);
            guardarDatos();
        }

        function mostrarConfig() {
            document.getElementById('configPanel').style.display = 'block';
            document.getElementById('tarifaInput').value = tarifaPorHora;
            document.getElementById('soundToggle').checked = soundEnabled;
        }

        function ocultarConfig() {
            document.getElementById('configPanel').style.display = 'none';
        }

        function guardarConfig() {
            const nuevaTarifa = parseFloat(document.getElementById('tarifaInput').value);
            if (!isNaN(nuevaTarifa) && nuevaTarifa >= 0) {
                tarifaPorHora = nuevaTarifa;
                soundEnabled = document.getElementById('soundToggle').checked;
                guardarDatos();
                renderMesas();
                ocultarConfig();
            }
        }

        function imprimir(index) {
            const mesa = mesas[index];
            const tiempoUsado = calcularTiempoUsado(mesa);
            const total = calcularTotal(mesa);
            const ventana = window.open('', '_blank');
            ventana.document.write(`
        <html>
          <head><title>Ticket Mesa ${index + 1}</title></head>
          <body>
            <h1>Mesa ${index + 1}</h1>
            <p>Tiempo: ${formatTime(tiempoUsado)}</p>
            <ul>${mesa.extras.map(e => `<li>${e.nombre}: $${e.valor.toFixed(2)}</li>`).join('')}</ul>
            <p><strong>Total: $${total.toFixed(2)}</strong></p>
          </body>
        </html>
      `);
            ventana.document.close();
            ventana.print();
        }

        document.getElementById('addMesaBtn').addEventListener('click', () => {
            mesas.push({
                inicio: null,
                tiempoTotal: 0,
                extras: [],
                running: false,
                temporizador: null,
                expirada: false
            });
            renderMesas();
        });

        setInterval(() => {
            mesas.forEach((mesa, index) => {
                if (mesa.temporizador && mesa.running) {
                    const tiempoUsado = calcularTiempoUsado(mesa);
                    if (tiempoUsado >= mesa.temporizador && !mesa.expirada) {
                        mesa.expirada = true;
                        detener(index);
                        mostrarNotificacion(`⏰ Mesa ${index + 1} - Temporizador finalizado!`);
                    }
                }
            });

            actualizarTiempos(); // 👈 Solo actualiza visualmente tiempos y totales
        }, 1000);


        // Carga inicial
        if (mesas.length === 0) {
            for (let i = 0; i < 5; i++) {
                mesas.push({
                    inicio: null,
                    tiempoTotal: 0,
                    extras: [],
                    running: false,
                    temporizador: null,
                    expirada: false
                });
            }
        }
        renderMesas();
        function actualizarTiempos() {
            mesas.forEach((mesa, index) => {
                if (mesa.running) {
                    const tiempoUsado = calcularTiempoUsado(mesa);
                    const total = calcularTotal(mesa);

                    const mesaElement = document.querySelectorAll('.mesa')[index];
                    if (mesaElement) {
                        // Buscar el div que contiene el texto "🕒 Tiempo:"
                        const tiempoLabel = Array.from(mesaElement.querySelectorAll('div'))
                            .find(div => div.textContent.includes('🕒 Tiempo:'));

                        if (tiempoLabel) {
                            tiempoLabel.innerHTML = `<strong>🕒 Tiempo:</strong> ${formatTime(tiempoUsado)}`;
                        }

                        const totalDiv = mesaElement.querySelector('.mesa-header div');
                        if (totalDiv) {
                            totalDiv.innerHTML = `<strong>$${total.toFixed(2)}</strong>`;
                        }
                    }
                }
            });

            actualizarResumen();
        }