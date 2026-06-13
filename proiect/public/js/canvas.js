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
        saveStatus.textContent = 'Cytoscape failed to load';
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
        edgeHint.textContent = 'Shift+click another node to connect (Esc to cancel)';
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
            name: fileNameInput.value.trim() || 'Untitled file',
            nodes: cy.nodes().map(n => ({
                nodeId: n.id(),
                label: n.data('label') || 'New node',
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
        saveStatus.textContent = 'Unsaved...';
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(saveNow, 800);
    }

    async function saveNow() {
        if (!dirty) return;
        dirty = false;
        saveStatus.textContent = 'Saving...';
        try {
            const res = await fetch('/api/files/' + fileId, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serializeGraph())
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            saveStatus.textContent = 'Saved';
        } catch (err) {
            console.error(err);
            saveStatus.textContent = 'Save error';
            dirty = true;
        }
    }

    function addNodeAt(pos, label) {
        const id = nextId('n');
        const ele = cy.add({
            group: 'nodes',
            data: { id, label: label || 'New node', note: '', hasNote: 'false' },
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
                <h3>Details</h3>
                <p class="empty">Select a node to edit its label and note.</p>
                <div class="hint">
                    <strong>How to use:</strong><br>
                    - Double-click on canvas: new node<br>
                    - <em>+ Node</em> button: new node at center<br>
                    - <strong>Shift+click</strong> a node, then another: connect<br>
                    - Double-click a node: quick rename<br>
                    - Select + <em>Delete</em> key: remove<br>
                    - Scroll: zoom &nbsp;/&nbsp; drag background: pan<br>
                    - <em>Esc</em>: cancel connection mode
                </div>`;
            return;
        }
        if (selected.length > 1) {
            sidePanel.innerHTML = `<h3>Details</h3><p class="empty">${selected.length} elements selected.</p>`;
            return;
        }
        const el = selected[0];
        if (el.isNode()) {
            sidePanel.innerHTML = `
                <h3>Node selected</h3>
                <small>ID: ${el.id()}</small>
                <label>Label</label>
                <input id="node-label" type="text" value="${escapeAttr(el.data('label') || '')}">
                <label>Note</label>
                <textarea id="node-note" placeholder="Write a note for this node...">${escapeText(el.data('note') || '')}</textarea>`;
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
                <h3>Connection selected</h3>
                <small>${el.data('source')} &rarr; ${el.data('target')}</small>
                <button id="del-edge" style="background:transparent;color:#dc3545;border:1.5px solid #dc3545;padding:8px;border-radius:3px;cursor:pointer;margin-top:8px;font-weight:600;width:100%;">Delete connection</button>`;
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
            const newLabel = prompt('Rename node:', node.data('label') || '');
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
            saveStatus.textContent = 'Load error';
        });
})();
