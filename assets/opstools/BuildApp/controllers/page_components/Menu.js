steal(
	// List your Controller's dependencies here:
	'opstools/BuildApp/models/ABPage.js',
	function () {
        System.import('appdev').then(function () {
			steal.import('appdev/ad',
				'appdev/control/control').then(function () {

					// Namespacing conventions:
					// AD.Control.extend('[application].[controller]', [{ static },] {instance} );
					AD.Control.extend('opstools.BuildApp.Components.Menu', {

						init: function (element, options) {
							var self = this;

							self.data = {};
							self.info = {
								name: 'Menu',
								icon: 'fa-th-list'
							};

							self.Model = AD.Model.get('opstools.BuildApp.ABPage');

							self.componentIds = {
								editMenu: 'ab-menu-edit-mode',

								pageTree: 'ab-menu-page-tree'
							};

							self.view = {
								view: "menu",
								autoheight: true,
								minWidth: 500,
								datatype: "json"
							};

							self.getView = function () {
								return self.view;
							};

							self.getEditView = function () {
								var menu = $.extend(true, {}, self.getView());
								menu.id = self.componentIds.editMenu;

								var editView = {
									id: self.info.name + '-edit-view',
									padding: 10,
									rows: [
										menu,
										{
											view: 'label',
											label: 'Page list'
										},
										{
											id: self.componentIds.pageTree,
											view: 'tree',
											template: "<div class='ab-page-list-item'>" +
											"{common.icon()} {common.checkbox()} {common.folder()} #label#" +
											"</div>",
											on: {
												onItemCheck: function () {
													$$(self.componentIds.editMenu).clearAll();

													$$(self.componentIds.pageTree).getChecked().forEach(function (pageId) {
														var item = $$(self.componentIds.pageTree).getItem(pageId);

														$$(self.componentIds.editMenu).add({
															id: pageId,
															value: item.label
														}, $$(self.componentIds.editMenu).count());
													});
												}
											}
										}
									]
								};

								return editView;
							};

							self.getPropertyView = function () {
								return {
									view: "property",
									id: self.info.name + '-property-view',
									elements: [
										{
											label: "Orientation",
											type: "select",
											id: 'layout',
											options: [
												{ id: 'x', value: "Horizontal" },
												{ id: 'y', value: "Vertical" }
											]
											// ,on: {
											// 	onChange: function (newv, oldv) {
											// 		if (newv != oldv) {
											// 			$$(self.componentIds.editMenu).define('layout', newv);
											// 			$$(self.componentIds.editMenu).render();
											// 		}
											// 	}
											// }
										},
									],
									on: {
										onLiveEdit: function (state, editor, ignoreUpdate) {
											console.log(state, editor, ignoreUpdate);
										}
									}
								};
							};

							self.getSettings = function () {
								var values = $$(self.info.name + '-property-view').getValues();

								var settings = {
									layout: values.layout
								};

								settings.data = $$(self.componentIds.editMenu).find(function () { return true; });

								return settings;
							};

							self.populateSettings = function (settings) {
								// Menu
								$$(self.componentIds.editMenu).clearAll();
								if (settings.data)
									$$(self.componentIds.editMenu).parse(settings.data);

								// Page list
								$$(self.componentIds.pageTree).clearAll();
								var pageItems = [];
								if (settings.page) {
									webix.extend($$(self.componentIds.pageTree), webix.ProgressBar);

									$$(self.componentIds.pageTree).showProgress({ type: 'icon' });

									var parentId = settings.page.parent ? settings.page.parent.attr('id') : settings.page.attr('id');
									self.Model.findAll({ or: [{ id: parentId }, { parent: parentId }] }) // Get children
										.fail(function (err) {
											$$(self.componentIds.pageTree).hideProgress();
										})
										.then(function (pages) {
											pages.forEach(function (p) {
												if (p.translate)
													p.translate();
											});

											pageItems = $.map(pages.attr(), function (p) {
												if (!p.parent) { // Get root page
													var pageItem = {
														id: p.id,
														value: p.name,
														label: p.label
													};

													// Get children pages
													pageItem.data = $.map(pages.attr(), function (subP) {
														if (subP.parent && subP.parent.id == p.id) {
															return {
																id: subP.id,
																value: subP.name,
																label: subP.label
															}
														}
													});

													return pageItem;
												}
											});

											$$(self.componentIds.pageTree).parse(pageItems);
											$$(self.componentIds.pageTree).openAll();

											// Set checked items
											if (settings.data) {
												settings.data.forEach(function (d) {
													$$(self.componentIds.pageTree).checkItem(d.id);
												});
											}

											$$(self.componentIds.pageTree).hideProgress();
										});
								}

								// Properties
								if (settings.layout) {
									$$(self.info.name + '-property-view').setValues({
										layout: settings.layout
									});
								}
								$$(self.info.name + '-property-view').refresh();
							};

							self.editStop = function () {
								$$(self.info.name + '-property-view').editStop();
							};
						},

						getInstance: function () {
							return this;
						}

					});

				});
		});
	}
);