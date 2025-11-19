const API = 'https://fi.jcaguilar.dev/v1/escuela/persona';

const modal = document.getElementById('app-modal');
const overlay = document.getElementById('modal-overlay'); 
const form = document.getElementById('data-form');
const msgBox = document.getElementById('msg-toast'); 
const table = document.getElementById('data-table');

const ROLE_MAP = {
    1: 'Alumno', 2: 'Profesor', 3: 'Administrador', 4: 'Externo'
};


function showMsg(txt, isError = false) {
    msgBox.textContent = txt;
    msgBox.style.display = 'block';
    msgBox.style.backgroundColor = isError ? '#dc3545' : '#28a745'; 
    setTimeout(() => { msgBox.style.display = 'none'; }, 3000);
}

function formatDate(isoStr) {
    if (!isoStr) return 'N/A';
    return isoStr.split('T')[0];
}


function openModal(isNew = true, data = null) {
    
    overlay.style.display = 'block';
    modal.style.display = 'block';

    if (isNew) {
        form.reset();
        document.getElementById('person-id').value = '';
        document.getElementById('modal-title').textContent = 'Nuevo Registro';
    } else if (data) {
        const id = data.id_persona || data.id;
        document.getElementById('modal-title').textContent = 'Editando ID: ' + id;
        document.getElementById('person-id').value = id;
        document.getElementById('fname').value = data.nombre || '';
        document.getElementById('lname').value = data.apellido || '';
        
        
        let sexVal = data.sexo;
        
        if (sexVal === 'Hombre') sexVal = 'H';
        if (sexVal === 'Femenino') sexVal = 'M';
       
        const validOptions = ['H', 'M', 'O'];
        document.getElementById('sex-sel').value = validOptions.includes(sexVal) ? sexVal : '';
        
        if (data.fh_nac) {
            document.getElementById('birth-date').value = data.fh_nac.split('T')[0];
        }
        document.getElementById('role-sel').value = data.id_rol || data.rol || '';
    }
}

function closeModal() {

    overlay.style.display = 'none';
    modal.style.display = 'none';
}



async function fetchData() {
    table.innerHTML = '<tr><td colspan="7" style="text-align:center">Cargando datos...</td></tr>';
    try {
        const res = await fetch(API);
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        renderRows(data);
    } catch (err) {
        console.error(err);
        table.innerHTML = '<tr><td colspan="7" style="color:red; text-align:center">Error de conexión</td></tr>';
    }
}

function renderRows(list) {
    table.innerHTML = '';
    if (!list || list.length === 0) {
        table.innerHTML = '<tr><td colspan="7" style="text-align:center">No hay registros disponibles</td></tr>';
        return;
    }
    
    list.forEach(p => {
        const id = p.id_persona || p.id || 'N/A';
        const idRol = p.id_rol || p.rol;
        let roleText = ROLE_MAP[idRol] || `Rol ${idRol}`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${id}</td>
            <td>${p.nombre || ''}</td>
            <td>${p.apellido || ''}</td>
            <td>${p.sexo || ''}</td>
            <td>${formatDate(p.fh_nac)}</td>
            <td>${roleText}</td>
            <td>
                <button class="btn-edit" style="cursor:pointer; margin-right:5px;">Editar</button>
                <button class="btn-del" style="color:red; cursor:pointer;">Eliminar</button>
            </td>
        `;
       
        tr.querySelector('.btn-edit').onclick = () => openModal(false, p);
        tr.querySelector('.btn-del').onclick = () => deleteItem(id);
        
        table.appendChild(tr);
    });
}

async function deleteItem(id) {
    if (!confirm('¿Eliminar registro ID ' + id + '?')) return;
    try {
        const res = await fetch(API, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_persona: Number(id) })
        });
        if (res.ok) {
            showMsg('Registro eliminado');
            fetchData();
        } else { throw new Error('Error al eliminar'); }
    } catch (e) { showMsg('No se pudo eliminar', true); }
}

form.onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save');
    btn.disabled = true;
    btn.textContent = 'Procesando...';

    const idStr = document.getElementById('person-id').value;
    const id = idStr ? Number(idStr) : null;

    const payload = {
        nombre: document.getElementById('fname').value.trim(),
        apellido: document.getElementById('lname').value.trim(),
        sexo: document.getElementById('sex-sel').value,
        fh_nac: document.getElementById('birth-date').value,
        id_rol: Number(document.getElementById('role-sel').value)
    };

    try {
        let res;
        if (id) {
            payload.id_persona = id;
            res = await fetch(API, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (res.ok) {
            showMsg(id ? 'Actualizado correctamente' : 'Creado correctamente');
            closeModal(); 
            fetchData();
        } else {
            throw new Error(await res.text() || res.statusText);
        }
    } catch (err) {
        showMsg('Error: ' + err.message, true);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar';
    }
};


fetchData();