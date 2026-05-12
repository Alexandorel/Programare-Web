(function () {
    const fileId = window.__FILE_ID__;
    const fileNameInput = document.getElementById('file-name');
    const saveStatus = document.getElementById('save-status');
    const sidePanel = document.getElementById('side-panel');
    const edgeHint = document.getElementById('edge-hint');

    let saveTimer = null;
    let dirty = false;
    let pendingEdgeSource = null;

    function nextId(prefix) {
        return prefix + '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
    }

    if (typeof cytoscape === 'undefined') {
        saveStatus.textContent = 'Cytoscape nu s-a incarcat';
        console.error('Cytoscape lib missing');
        return;
    }

    const cy = cytoscape({
        container: document.getElementById('cy'),
        wheelSensitivity: 0.2,
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': '#4f8cff',
                    'label': 'data(label)',
                    'color': '#fff',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'font-size': '13px',
                    'text-wrap': 'wrap',
                    'text-max-width': 100,
                    'width': 60,
                    'height': 60,
                    'border-width': 2,
                    'border-color': '#3a6dc4'
                }
            },
            { selector: 'node:selected', style: { 'border-color': '#ffd866', 'border-width': 4 } },
            { selector: 'node[hasNote = "true"]', style: { 'background-color': '#ff9a4f', 'border-color': '#c46d2c' } },
            { selector: 'node.edge-source', style: { 'border-color': '#22c55e', 'border-width': 4 } },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#888',
                    'target-arrow-color': '#888',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
                }
            },
            { selector: 'edge:selected', style: { 'line-color': '#ffd866', 'target-arrow-color': '#ffd866', 'width': 3 } }
        ]
    });

    function clearEdgeSource() {
        if (pendingEdgeSource) {
            pendingEdgeSource.removeClass('edge-source');
            pendingEdgeSource = null;
        }
        edgeHint.style.display = 'none';
    }

    function setEdgeSource(node) {
        clearEdgeSource();
        pendingEdgeSource = node;
        node.addClass('edge-source');
        edgeHint.style.display = 'inline';
        edgeHint.textContent = 'Shift+click un alt nod pentru conexiune (Esc anuleaza)';
    }

    function loadGraph(data) {
        fileNameInput.value = data.name || '';
        const nodes = (data.nodes || []).map(n => ({
            group: 'nodes',
            data: { id: n.nodeId, label: n.label, note: n.note || '', hasNote: n.note ? 'true' : 'false' },
            position: { x: n.x || 0, y: n.y || 0 }
        }));
        const edges = (data.edges || []).map(e => ({
            group: 'edges',
            data: { id: e.edgeId, edgeId: e.edgeId, source: e.source, target: e.target }
        }));
        cy.elements().remove();
        cy.add([...nodes, ...edges]);
        if (nodes.length > 0) cy.fit(undefined, 50);
        renderSidePanel();
    }

    function serializeGraph() {
        return {
            name: fileNameInput.value.trim() || 'Fisier fara titlu',
            nodes: cy.nodes().map(n => ({
                nodeId: n.id(),
                label: n.data('label') || 'Nod nou',
                note: n.data('note') || '',
                x: n.position('x'),
                y: n.position('y')
            })),
            edges: cy.edges().map(e => ({
                edgeId: e.id(),
                source: e.data('source'),
                target: e.data('target')
            }))
        };
    }

    function markDirty() {
        dirty = true;
        saveStatus.textContent = 'Nesalvat...';
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(saveNow, 800);
    }

    async function saveNow() {
        if (!dirty) return;
        dirty = false;
        saveStatus.textContent = 'Salvez...';
        try {
            const res = await fetch('/api/files/' + fileId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serializeGraph())
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            saveStatus.textContent = 'Salvat';
        } catch (err) {
            console.error(err);
            saveStatus.textContent = 'Eroare la salvare';
            dirty = true;
        }
    }

    function addNodeAt(pos, label) {
        const id = nextId('n');
        const ele = cy.add({
            group: 'nodes',
            data: { id, label: label || 'Nod nou', note: '', hasNote: 'false' },
            position: pos
        });
        markDirty();
        return ele;
    }

    function connectNodes(source, target) {
        if (!source || !target || source.same(target)) return;
        const existing = cy.edges().filter(e =>
            e.data('source') === source.id() && e.data('target') === target.id()
        );
        if (existing.length > 0) return;
        const id = nextId('e');
        cy.add({
            group: 'edges',
            data: { id, edgeId: id, source: source.id(), target: target.id() }
        });
        markDirty();
    }

    function renderSidePanel() {
        const selected = cy.$('node:selected, edge:selected');
        if (selected.length === 0) {
            sidePanel.innerHTML = `
                <h3>Detalii</h3>
                <p class="empty">Selecteaza un nod pentru a-i edita eticheta si nota.</p>
                <div class="hint">
                    <strong>Cum se foloseste:</strong><br>
                    - Dublu-click pe canvas: nod nou<br>
                    - Buton <em>+ Nod</em>: nod nou in centru<br>
                    - <strong>Shift+click</strong> pe un nod, apoi pe altul: conexiune<br>
                    - Dublu-click pe nod: redenumire rapida<br>
                    - Selecteaza + tasta <em>Delete</em>: sterge<br>
                    - Scroll: zoom, drag fundal: pan<br>
                    - <em>Esc</em>: anuleaza modul de conexiune
                </div>`;
            return;
        }
        if (selected.length > 1) {
            sidePanel.innerHTML = `<h3>Detalii</h3><p class="empty">${selected.length} elemente selectate.</p>`;
            return;
        }
        const el = selected[0];
        if (el.isNode()) {
            sidePanel.innerHTML = `
                <h3>Nod selectat</h3>
                <small>ID: ${el.id()}</small>
                <label>Eticheta</label>
                <input id="node-label" type="text" value="${escapeAttr(el.data('label') || '')}">
                <label>Nota</label>
                <textarea id="node-note" placeholder="Scrie o nota pentru acest nod...">${escapeText(el.data('note') || '')}</textarea>`;
            document.getElementById('node-label').addEventListener('input', (e) => {
                el.data('label', e.target.value);
                markDirty();
            });
            document.getElementById('node-note').addEventListener('input', (e) => {
                const val = e.target.value;
                el.data('note', val);
                el.data('hasNote', val ? 'true' : 'false');
                markDirty();
            });
        } else {
            sidePanel.innerHTML = `
                <h3>Conexiune selectata</h3>
                <small>${el.data('source')} &rarr; ${el.data('target')}</small>
                <button id="del-edge" style="background:#a33d3d;color:#fff;border:none;padding:8px;border-radius:6px;cursor:pointer;margin-top:8px;">Sterge conexiunea</button>`;
            document.getElementById('del-edge').addEventListener('click', () => {
                el.remove();
                markDirty();
                renderSidePanel();
            });
        }
    }

    function escapeAttr(s) { return String(s).replace(/"/g, '&quot;'); }
    function escapeText(s) { return String(s).replace(/</g, '&lt;'); }

    cy.on('tap', (evt) => {
        if (evt.target === cy) {
            clearEdgeSource();
            renderSidePanel();
            return;
        }
        if (evt.target.isNode && evt.target.isNode()) {
            const shift = evt.originalEvent && evt.originalEvent.shiftKey;
            if (shift) {
                if (!pendingEdgeSource) {
                    setEdgeSource(evt.target);
                } else {
                    connectNodes(pendingEdgeSource, evt.target);
                    clearEdgeSource();
                }
            }
        }
    });

    cy.on('select unselect', renderSidePanel);

    cy.on('dbltap', (evt) => {
        if (evt.target === cy) {
            addNodeAt(evt.position);
        } else if (evt.target.isNode && evt.target.isNode()) {
            const node = evt.target;
            const newLabel = prompt('Redenumeste nodul:', node.data('label') || '');
            if (newLabel !== null) {
                node.data('label', newLabel);
                markDirty();
                renderSidePanel();
            }
        }
    });

    cy.on('dragfree', 'node', markDirty);

    document.addEventListener('keydown', (e) => {
        const target = e.target;
        const inField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');
        if (e.key === 'Escape') {
            clearEdgeSource();
            return;
        }
        if ((e.key === 'Delete' || e.key === 'Backspace') && !inField) {
            const sel = cy.$(':selected');
            if (sel.length > 0) {
                sel.remove();
                markDirty();
                renderSidePanel();
            }
        }
    });

    fileNameInput.addEventListener('input', markDirty);

    document.getElementById('btn-add-node').addEventListener('click', () => {
        const ext = cy.extent();
        const x = (ext.x1 + ext.x2) / 2;
        const y = (ext.y1 + ext.y2) / 2;
        addNodeAt({ x, y });
    });

    document.getElementById('btn-save').addEventListener('click', saveNow);
    document.getElementById('btn-fit').addEventListener('click', () => cy.fit(undefined, 50));

    window.addEventListener('beforeunload', (e) => {
        if (dirty) { e.preventDefault(); e.returnValue = ''; }
    });

    fetch('/api/files/' + fileId)
        .then(r => r.json())
        .then(loadGraph)
        .catch(err => {
            console.error(err);
            saveStatus.textContent = 'Eroare la incarcare';
        });
})();
