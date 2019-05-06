import { html } from 'https://unpkg.com/lit-html?module';

export const lossBox = (showLossBox, closeLossBox) => showLossBox ? html`
    <div class="panel">
        <div id="lossPlotBox" style="margin: 0 auto !important"></div>
        <button class="btn btn-error m-2" @click=${closeLossBox}>
            Close Plot
        </button>
    </div>
` : '';

export const navbarBox = (showModal, exportLink) => html`
    <section class="navbar-section">
        <a class="btn btn-action" href="#sidebar">
            <i class="icon icon-menu"></i
        ></a>
    </section>
    <section class="navbar-center">
        <span class="text-primary">Atlas</span>
    </section>
    <section class="navbar-section">
        <button class="btn mr-2 btn-action" @click=${showModal}>
            <i class="icon icon-emoji"></i>
        </button>
        <button class="btn ml-2 btn-action tooltip tooltip-left" data-tooltip="Share with a friend." @click=${exportLink}>
            <i class="icon icon-share"></i>
        </button>
    </section>
`;

export const startVisualizerBox = visualizerClick => html`
    <div class="empty panel">
        <p class="empty-title h5">The loss surface has not been generated.</p>
        <p class="empty-subtitle">
            Click the button to begin visualization. This may take some time.
        </p>

        <div class="empty-action">
            <button class="btn btn-primary" @click=${visualizerClick}>
                Generate loss surface
            </button>
        </div>
    </div>
`;

export const plotVisualizerBox = visualizerCancel => html`
    <div class="panel">
        <div id="plotBox"></div>
        <button class="btn btn-error m-2" @click=${visualizerCancel}>
            Close Plot
        </button>
    </div>
`;

export const loadVisualizerBox = (progress, message, onCancel) => html`
    <div class="empty panel">
        <p class="empty-title h5">The loss surface is being generated.</p>
        <p class="empty-subtitle" style="width:100%">
            <p>${message}</p>
            <progress class="progress" value=${progress} max="100"></progress>
        </p>

        <div class="empty-action">
            <button class="btn btn-error" @click=${onCancel}>Cancel</button>
        </div>
    </div>
`;

export const modalBox = (active, closeModal) => html`
    <div class="modal ${active ? 'active' : ''}" id="modal-id">
        <a
            href="#close"
            @click=${closeModal}
            class="modal-overlay"
            aria-label="Close"
        ></a>
        <div class="modal-container">
            <div class="modal-header">
                <a
                    href="#close"
                    @click=${closeModal}
                    class="btn btn-clear float-right"
                    aria-label="Close"
                ></a>
                <div class="modal-title h5">About Atlas</div>
            </div>

            <div class="modal-body">
                <div class="content">
                    Atlas is an optimization loss surface visualizer built as a
                    final project for
                    <a href="http://math.mit.edu/classes/18.065/2019SP/"
                        >18.065: Matrix Methods In Data Analysis, Signal
                        Processing, And Machine Learning</a
                    >, taught by
                    <a href="http://www-math.mit.edu/~gs/"
                        >Professor Gill Strang</a
                    >.
                </div>
            </div>

            <div class="modal-footer">
                Created by
                <a href="https://github.com/mfranzs">Martin Schneider</a>,
                <a href="https://github.com/scherna">Sammy Cherna</a>,
                <a href="https://github.com/lhirschfeld">Lior Hirschfeld</a>,
                and
                <a href="https://github.com/joshuagruenstein">Josh Gruenstein</a
                >.
            </div>
        </div>
    </div>
`;

export const variable = (
    variable,
    typeChangeVariable,
    csvVariable,
    deleteVariable
) => html`
    <ul
        class="menu text-primary mt-2"
        style="width:250px"
        .variable=${variable}
    >
        <li class="menu-item pt-2">
            <div class="input-group">
                <input class="form-input" type="text" placeholder="Variable" />
                <select
                    class="form-select"
                    @change=${() => typeChangeVariable(variable)}
                >
                    <option>Scalar</option>
                    <option>Vector</option>
                    <option>Matrix</option>
                </select>
            </div>
        </li>

        ${variable.type === 'Scalar'
            ? html`
                  <li class="menu-item pt-2">
                      <div class="input-group">
                          <span class="input-group-addon ">Value</span>
                          <input
                              class="form-input"
                              type="number"
                              size="2"
                              placeholder="10"
                          />
                      </div>
                  </li>
              `
            : variable.type === 'Vector'
            ? html`
                  <li class="menu-item pt-2">
                      <div class="input-group">
                          <span class="input-group-addon ">Length</span>
                          <input
                              class="form-input"
                              type="number"
                              size="2"
                              placeholder="i"
                          />
                      </div>
                  </li>
              `
            : html`
                  <li class="menu-item pt-2">
                      <div class="input-group">
                          <span class="input-group-addon ">Shape</span>
                          <input
                              class="form-input"
                              type="number"
                              size="2"
                              placeholder="i"
                          />
                          <input
                              class="form-input "
                              type="number"
                              size="2"
                              placeholder="j"
                          />
                      </div>
                  </li>
              `}
        ${variable.type !== 'Scalar'
            ? html`
                  <li class="menu-item">
                      <a @click=${() => csvVariable(variable)}>
                          <i class="icon icon-apps"></i> Set Value From CSV
                      </a>
                  </li>
              `
            : ''}

        <li class="divider"></li>

        <li class="menu-item">
            <label class="form-switch">
                <input type="checkbox" />
                <i class="form-icon"></i> Trainable
            </label>
        </li>

        <li class="menu-item">
            <a
                class="text-error"
                @click=${() => deleteVariable(variable)}
            >
                <i class="icon icon-delete"></i> Delete
            </a>
        </li>
    </ul>
`;

export const message = (message, deleteMessage) => html`
    <div class="toast toast-${message.type} mt-2">
        <button
            class="btn btn-clear float-right"
            @click=${() => deleteMessage(message)}
        ></button>
        ${message.content}
    </div>
`;

export const variableBox = (
    variables,
    typeChangeVariable,
    csvVariable,
    deleteVariable,
    newVariable
) => html`
    ${variables.map(v =>
        variable(v, typeChangeVariable, csvVariable, deleteVariable)
    )}

    <ul class="menu text-primary mt-2 mb-2" style="width:250px">
        <li class="menu-item">
            <a @click=${newVariable}>
                <i class="icon icon-plus"></i> New Variable
            </a>
        </li>
    </ul>
`;

export const messageBox = (messages, deleteMessage) => html`
    ${messages.map(m => message(m, deleteMessage))}
`;

export const settingsBox = (settings, changeOptimizer) => html`
    <ul class="menu">
        <li class="divider" data-content="SURFACE"></li>

        <li class="menu-item">
            <div class="input-group">
                <span class="input-group-addon">Granularity</span>
                <input class="form-input" type="number" size="2" value="10" />
            </div>
        </li>

        <li class="menu-item">
            <label class="form-switch">
                <input type="checkbox" checked/>

                <i class="form-icon"></i> Show optimizer path
            </label>
        </li>

        <li class="menu-item">
            <label class="form-switch">
                <input type="checkbox"/>

                <i class="form-icon"></i> Use PCA directions
            </label>
        </li>

        <li class="divider" data-content="OPTIMIZER"></li>

        <li class="menu-item">
            <select class="form-select" @change=${changeOptimizer}>
                <option>SGD</option>
                <option>Momentum</option>
                <option>Adagrad</option>
                <option>Adadelta</option>
                <option>Adam</option>
                <option>RMSProp</option>
            </select>
        </li>

        <li class="menu-item pt-2">
            <div class="input-group">
                <span class="input-group-addon">Learning Rate</span>
                <input
                    class="form-input"
                    type="number"
                    size="2"
                    value="0.01"
                    step="0.00000001"
                    min="0"
                />
            </div>
        </li>

        ${settings.optimizer === 'Momentum'
            ? html`
                  <li class="menu-item pt-2">
                      <div class="input-group">
                          <span class="input-group-addon ">Momentum</span>
                          <input
                              class="form-input"
                              type="number"
                              size="2"
                              placeholder="0.01"
                              value="0.01"
                              step="0.00000001"
                              min="0"
                          />
                      </div>
                  </li>
              `
            : ''}

        <li class="menu-item pt-2 pb-2">
            <div class="input-group">
                <span class="input-group-addon ">Epochs</span>
                <input class="form-input" type="number" size="2" min="0" step="1" value="50" />
            </div>
        </li>
    </ul>
`;