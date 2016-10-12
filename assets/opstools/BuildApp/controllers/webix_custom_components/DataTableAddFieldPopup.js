steal(
    // List your Controller's dependencies here:
    function () {
        System.import('appdev').then(function () {
            steal.import('appdev/ad',
                'appdev/control/control').then(function () {

                    // Namespacing conventions:
                    // AD.Control.extend('[application].[controller]', [{ static },] {instance} );
                    AD.Control.extend('opstools.BuildApp.DataTableAddFieldPopup', {

                        init: function (element, options) {
                            var self = this;
                            options = AD.defaults({
                            }, options);
                            this.options = options;

                            // Call parent init
                            this._super(element, options);

                            this.data = {};
                            this.componentIds = {
                                chooseTypeMenu: 'ab-new-type-menu',
                                chooseTypeView: 'ab-new-none',

                                headerNameText: 'ab-new-field-name',
                                labelNameText: 'ab-new-label-name',

                                saveButton: 'ab-new-save-button'
                            };

                            this.initMultilingualLabels();
                            this.initWebixControls();
                        },

                        initMultilingualLabels: function () {
                            var self = this;
                            self.labels = {};
                            self.labels.common = {};
                            self.labels.add_fields = {};

                            self.labels.common.name = AD.lang.label.getLabel('ab.common.name') || 'Name';
                            self.labels.common.headerName = AD.lang.label.getLabel('ab.common.headerName') || 'Header name';
                            self.labels.common.ok = AD.lang.label.getLabel('ab.common.ok') || "Ok";
                            self.labels.common.cancel = AD.lang.label.getLabel('ab.common.cancel') || "Cancel";
                            self.labels.common.save = AD.lang.label.getLabel('ab.common.save') || "Save";


                            self.labels.add_fields.chooseType = AD.lang.label.getLabel('ab.add_fields.chooseType') || "Choose field type...";

                            self.labels.add_fields.label = AD.lang.label.getLabel('ab.add_fields.label') || 'Label';

                            self.labels.add_fields.addNewField = AD.lang.label.getLabel('ab.add_fields.addNewField') || "Add Column";

                            self.labels.add_fields.registerTableWarning = AD.lang.label.getLabel('ab.add_fields.registerTableWarning') || "Please register the datatable to add.";

                            self.labels.add_fields.invalidFieldTitle = AD.lang.label.getLabel('ab.add_fields.invalidFieldTitle') || "Your field name is invalid format";
                            self.labels.add_fields.invalidFieldDescription = AD.lang.label.getLabel('ab.add_fields.invalidFieldDescription') || "System disallow enter special character to field name.";

                            self.labels.add_fields.duplicateFieldTitle = AD.lang.label.getLabel('ab.add_fields.duplicateFieldTitle') || "Your field name is duplicate";
                            self.labels.add_fields.duplicateFieldDescription = AD.lang.label.getLabel('ab.add_fields.duplicateFieldDescription') || "Please change your field name";

                            self.labels.add_fields.cannotUpdateFields = AD.lang.label.getLabel('ab.add_fields.cannotUpdateFields') || "Could not update columns";
                            self.labels.add_fields.waitRestructureObjects = AD.lang.label.getLabel('ab.add_fields.waitRestructureObjects') || "Please wait until restructure objects is complete";
                        },

                        initWebixControls: function () {
                            var self = this,
                                editDefinitions = AD.classes.AppBuilder.DataFields.getEditDefinitions();

                            // Insert please select data type view
                            editDefinitions.splice(0, 0, {
                                id: self.componentIds.chooseTypeView,
                                rows: [
                                    { view: "label", label: self.labels.add_fields.chooseType }
                                ]
                            });

                            webix.protoUI({
                                name: 'add_fields_popup',
                                $init: function (config) {
                                },
                                defaults: {
                                    modal: true,
                                    ready: function () {
                                        this.resetState();
                                    },
                                    body: {
                                        width: 380,
                                        rows: [
                                            {
                                                view: "menu",
                                                id: self.componentIds.chooseTypeMenu,
                                                minWidth: 500,
                                                autowidth: true,
                                                data: [{
                                                    value: self.labels.add_fields.chooseType,
                                                    submenu: AD.classes.AppBuilder.DataFields.getFieldMenuList()
                                                }],
                                                on: {
                                                    onMenuItemClick: function (id) {
                                                        var base = this.getTopParentView(),
                                                            selectedMenuItem = this.getMenuItem(id),
                                                            viewName = AD.classes.AppBuilder.DataFields.getEditViewId(selectedMenuItem.fieldName);

                                                        if (viewName) {
                                                            AD.classes.AppBuilder.DataFields.populateSettings(AD.classes.AppBuilder.currApp, {
                                                                fieldName: selectedMenuItem.fieldName,
                                                                name: base.getDefaultFieldName(), // Set default field name
                                                                label: base.getDefaultFieldName()
                                                            });

                                                            $$(viewName).show();

                                                            // Highlight name in text box
                                                            $('.' + self.componentIds.headerNameText + ' input[type="text"]').select();

                                                            this.getTopParentView().fieldName = selectedMenuItem.fieldName;
                                                        }
                                                    }
                                                }
                                            },
                                            { height: 10 },
                                            { cells: editDefinitions },
                                            { height: 10 },
                                            {
                                                cols: [
                                                    {
                                                        view: "button", id: self.componentIds.saveButton, label: self.labels.add_fields.addNewField, type: "form", width: 120, click: function () {
                                                            var base = this.getTopParentView(),
                                                                dataTable = base.dataTable,
                                                                fieldInfo = AD.classes.AppBuilder.DataFields.getSettings(base.fieldName);

                                                            if (!dataTable) {
                                                                webix.message({ type: "error", text: self.labels.add_fields.registerTableWarning });
                                                                return;
                                                            }

                                                            if (!fieldInfo) {
                                                                webix.alert({
                                                                    title: 'Field info error',
                                                                    text: 'System could not get this field information ',
                                                                    ok: self.labels.common.ok
                                                                });
                                                                return;
                                                            }

                                                            // Validate format field name
                                                            if (!/^[a-zA-Z0-9\s]+$/.test(fieldInfo.name)) {
                                                                webix.alert({
                                                                    title: self.labels.add_fields.invalidFieldTitle,
                                                                    text: self.labels.add_fields.invalidFieldDescription,
                                                                    ok: self.labels.common.ok
                                                                });
                                                                return;
                                                            }

                                                            // Validate duplicate field name
                                                            var existsColumn = $.grep(dataTable.config.columns, function (c) { return c.id == fieldInfo.name; });
                                                            if (existsColumn && existsColumn.length > 0 && !self.data.editFieldId) {
                                                                webix.alert({
                                                                    title: self.labels.add_fields.duplicateFieldTitle,
                                                                    text: self.labels.add_fields.duplicateFieldDescription,
                                                                    ok: self.labels.common.ok
                                                                });
                                                                return;
                                                            }

                                                            if (self.data.editFieldId) // Update
                                                                fieldInfo.id = self.data.editFieldId;
                                                            else // Insert
                                                                fieldInfo.weight = dataTable.config.columns.length;

                                                            // Call callback function
                                                            if (base.saveFieldCallback && base.fieldName) {
                                                                base.saveFieldCallback(fieldInfo)
                                                                    .then(function () {
                                                                        base.resetState();
                                                                        base.hide();
                                                                    });
                                                            }

                                                        }
                                                    },
                                                    {
                                                        view: "button", value: self.labels.common.cancel, width: 100, click: function () {
                                                            this.getTopParentView().resetState();
                                                            this.getTopParentView().hide();
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    },
                                    on: {
                                        onBeforeShow: function () {
                                            this.resetState();
                                        },
                                        onShow: function () {
                                            if (!AD.comm.isServerReady()) {
                                                this.getTopParentView().hide();

                                                webix.alert({
                                                    title: self.labels.add_fields.cannotUpdateFields,
                                                    text: self.labels.add_fields.waitRestructureObjects,
                                                    ok: self.labels.common.ok
                                                });
                                            }
                                        },
                                        onHide: function () {
                                            this.resetState();
                                        }
                                    }
                                },

                                registerDataTable: function (dataTable) {
                                    this.dataTable = dataTable;
                                },

                                registerSaveFieldEvent: function (saveFieldCallback) {
                                    this.saveFieldCallback = saveFieldCallback;
                                },

                                registerCreateNewObjectEvent: function (createNewObjectEvent) {
                                    this.createNewObjectEvent = createNewObjectEvent;
                                },

                                editMode: function (data) {
                                    this.fieldName = data.fieldName;

                                    $$(self.componentIds.chooseTypeMenu).hide();

                                    $$(self.componentIds.saveButton).define('label', self.labels.common.save);
                                    $$(self.componentIds.saveButton).refresh();

                                    self.data.editFieldId = data.id;

                                    // Get view name
                                    var viewName = AD.classes.AppBuilder.DataFields.getEditViewId(data.fieldName);

                                    // Populate data
                                    AD.classes.AppBuilder.DataFields.populateSettings(AD.classes.AppBuilder.currApp, data);

                                    $$(viewName).show();

                                    // // Set field name
                                    // $('.' + self.componentIds.headerNameText).each(function (index, txtName) {
                                    //     $(txtName).webix_text().setValue(data.name.replace(/_/g, ' '));
                                    //     $(txtName).webix_text().disable();
                                    // });

                                    // // Set field label
                                    // $('.' + self.componentIds.labelNameText).each(function (index, lblName) {
                                    //     $(lblName).webix_text().setValue(data.label);
                                    // });

                                    // Highlight name in text box
                                    $('.' + self.componentIds.headerNameText + ' input[type="text"]').select();
                                },

                                resetState: function () {
                                    self.data.editFieldId = null;

                                    $$(self.componentIds.saveButton).define('label', self.labels.add_fields.addNewField);
                                    $$(self.componentIds.saveButton).refresh();
                                    $$(self.componentIds.chooseTypeView).show();
                                    $$(self.componentIds.chooseTypeMenu).show();

                                    AD.classes.AppBuilder.DataFields.resetState();
                                },

                                getDefaultFieldName: function () {
                                    var runningNumber = 1;

                                    if (this.dataTable)
                                        runningNumber = this.dataTable.config.columns.length;

                                    return 'Field ' + runningNumber;
                                }

                            }, webix.ui.popup);
                        }

                    });
                });
        });
    }
);