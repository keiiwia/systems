async function initYearDropdown() {
    try {
        const res = await fetch('json/information.json');
        const data = await res.json();
        let years = Object.keys(data.annual_totals || {}).sort();
        years = years.filter(y => y !== '2017');
        if (!years.length) return;

        let select = document.getElementById('year-select');
        if (!select) {
            select = document.createElement('select');
            select.id = 'year-select';
            select.className = 'year-select';
            document.body.appendChild(select);
        }
        select.innerHTML = '';
        for (const y of years) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            select.appendChild(opt);
        }
        select.value = years[years.length - 1];
        select.style.display = 'block';
    } catch (err) {
        console.error('Year dropdown init failed', err);
    }
}

function initViewButtons() {
    let container = document.getElementById('view-fabs');
    if (!container) {
        container = document.createElement('div');
        container.id = 'view-fabs';
        container.className = 'view-fabs';
        document.body.appendChild(container);
    }
    container.innerHTML = '';
    const labels = ['My Bedroom', 'Pedestrian View', 'Satellite View'];
    labels.forEach((label, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-text' + (idx === 0 ? ' is-active' : '');
        if (idx === 0) btn.setAttribute('aria-pressed', 'true');
        btn.textContent = label;
        container.appendChild(btn);
    });
    container.style.display = 'flex';
}


