class NestedViewerExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
        super(viewer, options);
        this._group = null;
        this._button = null;
        this._panel = null;
        this._onModelLoaded = this.onModelLoaded.bind(this);
    }

    load() {
        this.viewer.addEventListener(Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT, this._onModelLoaded);
        console.log('NestedViewerExtension has been loaded.');
        return true;
    }

    unload() {
        this.viewer.removeEventListener(Autodesk.Viewing.MODEL_ROOT_LOADED_EVENT, this._onModelLoaded);
        if (this._panel) {
            this._panel.uninitialize();
        }
        // Clean our UI elements if we added any
        if (this._group) {
            this._group.removeControl(this._button);
            if (this._group.getNumberOfControls() === 0) {
                this.viewer.toolbar.removeControl(this._group);
            }
        }
        console.log('NestedViewerExtension has been unloaded.');
        return true;
    }

    onModelLoaded() {
        if (this._panel) {
            this._panel.urn = this.viewer.model.getData().urn;
        }
    }

    onToolbarCreated() {
        this._group = this.viewer.toolbar.getControl('nestedViewerExtensionToolbar');
        if (!this._group) {
            this._group = new Autodesk.Viewing.UI.ControlGroup('nestedViewerExtensionToolbar');
            this.viewer.toolbar.addControl(this._group);
        }
        this._button = new Autodesk.Viewing.UI.Button('nestedViewerExtensionButton');
        this._button.onClick = (ev) => {
            if (!this._panel) {
                this._panel = new NestedViewerPanel(this.viewer);
                this._panel.urn = this.viewer.model.getData().urn;
            }
            this._panel.setVisible(!this._panel.isVisible());
        };
        this._button.setToolTip('Nested Viewer');
        this._button.addClass('nestedViewerExtensionIcon');
        this._group.addControl(this._button);
    }
}

class NestedViewerPanel extends Autodesk.Viewing.UI.DockingPanel {
    constructor(viewer) {
        super(viewer.container, 'nested-viewer-panel', 'Nested Viewer');
        this._urn = '';
    }

    get urn() {
        return this._urn;
    }

    set urn(value) {
        if (this._urn !== value) {
            this._urn = value;
            this._updateDropdown();
        }
    }

    initialize() {
        this.container.style.top = '5em';
        this.container.style.right = '5em';
        this.container.style.width = '500px';
        this.container.style.height = '400px';

        this.title = this.createTitleBar(this.titleLabel || this.container.id); // height: 50px
        this.container.appendChild(this.title);

        this._container = document.createElement('div');
        this._container.style.position = 'absolute';
        this._container.style.left = '0';
        this._container.style.top = '50px';
        this._container.style.width = '100%';
        this._container.style.height = '350px';
        this.container.appendChild(this._container);

        this._dropdown = document.createElement('select');
        this._dropdown.style.position = 'absolute';
        this._dropdown.style.left = '1em';
        this._dropdown.style.top = '1em';
        this._dropdown.style.setProperty('z-index', '100');
        this._dropdown.addEventListener('change', this._onDropdownChanged.bind(this))
        this._dropdown.addEventListener('mousedown', function (ev) { ev.stopPropagation(); }); // prevent DockingPanel from kidnapping clicks on the dropdown
        this._container.appendChild(this._dropdown);

        this.initializeMoveHandlers(this.container);
    }

    setVisible(show) {
        super.setVisible(show);
        if (show && !this._viewer) {
            this._viewer = new Autodesk.Viewing.GuiViewer3D(this._container);
            this._viewer.start();
            this._onDropdownChanged();
        }
    }

    _updateDropdown() {
        const onDocumentLoadSuccess = (doc) => {
            this._manifest = doc;
            const geometries = doc.getRoot().search({ type: 'geometry' });
            this._dropdown.innerHTML = geometries.map(function (geom) {
                return `<option value="${geom.guid()}">${geom.name()}</option>`;
            }).join('\n');
            this._onDropdownChanged();
        };
        const onDocumentLoadFailure = () => {
            console.error('Could not load document.');
        };
        this._dropdown.innerHTML = '';
        Autodesk.Viewing.Document.load('urn:' + this._urn, onDocumentLoadSuccess, onDocumentLoadFailure);
    }

    _onDropdownChanged() {
        const guid = this._dropdown.value;
        if (guid) {
            this._viewer.loadDocumentNode(this._manifest, this._manifest.getRoot().findByGuid(guid));
        }
    }
}

Autodesk.Viewing.theExtensionManager.registerExtension('NestedViewerExtension', NestedViewerExtension);
