(function($, w, d, u) {
	'use strict';
	modx.extended({
		frameset: 'frameset',
		minWidth: 480,
		init: function() {
			if(!localStorage.getItem('MODX_lastPositionSideBar')) {
				localStorage.setItem('MODX_lastPositionSideBar', this.config.tree_width)
			}
			if(w.location.hash) {
				w.main.frameElement.contentWindow.location = 'index.php' + w.location.hash.substring(1)
			}
			this.tree.init();
			this.mainMenu.init();
			this.resizer.init();
			this.search.init();
			this.setLastClickedElement(0, 0);
			if(this.config.session_timeout > 0) {
				w.setInterval(this.keepMeAlive, 1000 * 60 * this.config.session_timeout);
			}
			if(modx.config.mail_check_timeperiod > 0) {
				setTimeout('modx.updateMail(true)', 1000 * modx.config.mail_check_timeperiod)
			}
			d.onclick = this.hideDropDown
		},
		mainMenu: {
			id: 'mainMenu',
			init: function() {
				//console.log('modx.mainMenu.init()');
				var mm = d.getElementById('mainMenu'), el, els, i, ii, timer;
				mm.onclick = function(e) {
					el = e.target.closest('a');
					if(el) {
						if(el.classList.contains('dropdown-toggle')) {
							mm.classList.add('show');
							e.target.dataset.toggle = '#mainMenu';
						}
						if(!e.defaultPrevented) {
							els = mm.querySelectorAll('.nav > li.active');
							for(i = 0; i < els.length; i++) els[i].classList.remove('active');
							if(el.offsetParent.classList.contains('dropdown-menu')) {
								els = mm.querySelectorAll('.nav li.selected');
								for(i = 0; i < els.length; i++) els[i].classList.remove('selected');
								el.offsetParent.parentNode.classList.add('active');
								el.parentNode.classList.add('selected');
								if(el.offsetParent.id) {
									mm.querySelector('#' + el.offsetParent.id.substr(7)).classList.add('selected')
								}
							}
						}
					}
				};
				els = mm.querySelectorAll('.nav > li');
				for(i = 0; i < els.length; i++) {
					els[i].onmouseenter = function() {
						els = mm.querySelectorAll('.nav > li.hover');
						for(ii = 0; ii < els.length; ii++) els[ii].classList.remove('hover');
						this.classList.add('hover')
					}
				}
				els = mm.querySelectorAll('.nav > li > ul > li');
				for(i = 0; i < els.length; i++) {
					// :TODO добавить класс selected для второго уровня
					if(w.location.hash && els[i].firstChild && els[i].firstChild.href === w.location.href.replace('#', 'index.php')) {
						els[i].classList.add('selected')
					}
					els[i].onmouseenter = function(e) {
						var self = this;
						clearTimeout(timer);
						var ul = null;
						if(self.parentNode.parentNode.lastChild.classList && self.parentNode.parentNode.lastChild.classList.contains('sub-menu')) {
							ul = self.parentNode.parentNode.lastChild
						} else {
							ul = d.createElement('ul');
							ul.className = 'sub-menu dropdown-menu';
							self.parentNode.parentNode.appendChild(ul);
							ul.style.left = self.offsetWidth + 'px';
						}
						els = mm.querySelectorAll('.nav > li li.hover');
						for(ii = 0; ii < els.length; ii++) els[ii].classList.remove('hover');
						self.classList.add('hover');
						timer = setTimeout(function() {
							els = mm.querySelectorAll('.nav .sub-menu.show');
							for(ii = 0; ii < els.length; ii++) els[ii].classList.remove('show');
							if(self.classList.contains('toggle-dropdown')) {
								if(ul.id === 'parent_' + self.id) {
									ul.classList.add('show')
								} else {
									ul.classList.remove('show');
									timer = setTimeout(function() {
										var href = self.firstChild.href && self.firstChild.target === 'main' ? '&' + self.firstChild.href.split('?')[1] + '&parent=' + self.id : '';
										modx.post(modx.MODX_SITE_URL + modx.MGR_DIR + '/media/style/' + modx.config.theme + '/ajax.php', href, function(r) {
											if(r) {
												ul.innerHTML = r;
												ul.id = 'parent_' + self.id;
												var id = w.location.hash.substr(2).replace(/=/g, '_').replace(/&/g, '__');
												if(w.location.hash) {
													var el = d.getElementById(id);
													if(el) {
														el.parentNode.classList.add('selected');
														d.getElementById(el.parentNode.parentNode.id.substr(7)).classList.add('selected')
													}
												}
												els = ul.querySelectorAll('li');
												for(ii = 0; ii < els.length; ii++) {
													els[ii].onmouseenter = function() {
														clearTimeout(timer);
														els = self.parentNode.parentNode.querySelectorAll('li.hover');
														for(ii = 0; ii < els.length; ii++) els[ii].classList.remove('hover');
														this.classList.add('hover');
														self.classList.add('hover');
														e.stopPropagation()
													}
												}
												ul.classList.add('show');
												setTimeout(function() {
													modx.mainMenu.search(href, ul)
												}, 200)
											}
										})
									}, 100)
								}
							} else {
								if(ul.classList.contains('open')) {
									ul.classList.remove('open');
									setTimeout(function() {
										ul.parentNode.removeChild(ul)
									}, 100)
								}
							}
						}, 100)
					}
				}
			},
			search: function(href, ul) {
				var items,
					input = ul.querySelector('input[name=filter]'),
					index = -1;
				if(input) {
					input.focus();
					input.onkeyup = function(e) {
						if(e.keyCode === 13 && ul.querySelector('.item.hover')) {
							d.body.click();
							w.main.location.href = ul.querySelector('.item.hover').firstChild.href;
						} else if(e.keyCode == 38 || e.keyCode == 40) {
							input.selectionStart = input.value.length;
							items = ul.querySelectorAll('.item');
							if(items.length) {
								if(e.keyCode == 40) index++;
								else index--;
								if(index < 0) {
									index = -1;
									var el = ul.querySelector('.hover');
									if(el) el.classList.remove('hover');
								} else if(index > items.length - 1) {
									index = items.length - 1
								}
								if(index >= 0 && index < items.length) {
									el = ul.querySelector('.hover');
									if(el) el.classList.remove('hover');
									items[index].classList.add('hover');
								}
							}
						} else {
							modx.post(modx.MODX_SITE_URL + modx.MGR_DIR + '/media/style/' + modx.config.theme + '/ajax.php', href + '&filter=' + input.value, function(r) {
								index = -1;
								items = ul.querySelectorAll('.item');
								for(var i = 0; i < items.length; i++) ul.removeChild(items[i]);
								items = (new w.DOMParser).parseFromString(r, "text/html").documentElement.lastChild.childNodes;
								for(i = 0; i < items.length; i++) {
									items[i].onmouseenter = function() {
										var el = ul.querySelector('.hover');
										if(el) el.classList.remove('hover');
										this.classList.add('hover')
									}
									ul.appendChild(items[i]);
								}
							})
						}
					}
				}
			}
		},
		search: {
			id: 'searchform',
			idResult: 'searchresult',
			idInput: 'searchid',
			classResult: 'ajaxSearchResults',
			classMask: 'mask',
			timer: 0,
			init: function() {
				this.result = d.getElementById(this.idResult);
				var t = this,
					el = d.getElementById(this.idInput),
					r = d.createElement('i');
				r.className = 'fa fa-refresh fa-spin fa-fw';
				el.parentNode.appendChild(r);
				el.onkeyup = function(e) {
					e.preventDefault();
					clearTimeout(t.timer);
					if(el.value.length !== '' && el.value.length > 2) {
						t.timer = setTimeout(function() {
							var xhr = modx.XHR();
							xhr.open('GET', 'index.php?a=71&ajax=1&submitok=Search&searchid=' + el.value, true);
							xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
							xhr.onload = function() {
								if(this.status === 200) {
									r.style.display = 'none';
									var div = d.createElement('div');
									div.innerHTML = this.responseText;
									var o = div.getElementsByClassName(t.classResult)[0];
									if(o) {
										if(o.innerHTML !== '') {
											t.result.innerHTML = o.outerHTML;
											t.open();
											t.result.onclick = function(e) {
												if(e.target.tagName === 'I') {
													modx.openWindow({
														title: e.target.parentNode.innerText,
														id: e.target.parentNode.id,
														url: e.target.parentNode.href
													});
													return false
												}
												var p = (e.target.tagName === 'A' && e.target) || e.target.parentNode;
												if(p.tagName === 'A') {
													var el = t.result.querySelector('.selected');
													if(el) el.className = '';
													p.className = 'selected';
													if(w.innerWidth < modx.minWidth) t.close()
												}
											}
										} else {
											t.empty()
										}
									} else {
										t.empty()
									}
								}
							};
							xhr.onloadstart = function() {
								r.style.display = 'block'
							};
							xhr.onerror = function() {
								console.warn(this.status)
							};
							xhr.send()
						}, 300)
					} else {
						t.empty()
					}
				};
				el.onfocus = function() {
					t.open()
				};
				el.onclick = function() {
					t.open()
				};
				// el.onblur = function() {
				// 	t.close()
				// };
				el.onmouseenter = function() {
					t.open()
				};
				this.result.onmouseover = function() {
					t.open()
				};
				this.result.onmouseout = function() {
					t.close()
				};
				d.getElementById(this.id).getElementsByClassName(this.classMask)[0].onmouseenter = function() {
					t.open()
				};
				d.getElementById(this.id).getElementsByClassName(this.classMask)[0].onmouseout = function() {
					t.close()
				}
			},
			open: function() {
				if(this.result.getElementsByClassName(this.classResult)[0]) {
					this.result.classList.add('open')
				}
			},
			close: function() {
				this.result.classList.remove('open')
			},
			empty: function() {
				this.result.classList.remove('open');
				this.result.innerHTML = ''
			}
		},
		main: {
			id: 'main',
			idFrame: 'mainframe',
			as: null,
			onbeforeonload: function() {
			},
			onload: function() {
				this.tabRow.init();
				this.stopWork();
				this.scrollWork();
				w.main.onclick = modx.hideDropDown;
				w.main.oncontextmenu = this.oncontextmenu;
				w.location.hash = w.main.frameElement.contentWindow.location.search;
			},
			oncontextmenu: function(e) {
				if(e.ctrlKey) return;
				var el = e.target;
				if(/modxtv|modxplaceholder|modxattributevalue|modxchunk|modxsnippet|modxsnippetnocache/i.test(el.className)) {
					var id = Date.now(),
						name = el.innerText.replace(/[\[|\]|{|}|\*||\#|\+|?|\!|&|=|`]/g, ''),
						type = el.className.replace(/cm-modx/, ''),
						n = !!name.replace(/^\d+$/, '');
					if(name && n) {
						e.preventDefault();
						modx.post(modx.MODX_SITE_URL + modx.MGR_DIR + '/media/style/' + modx.config.theme + '/ajax.php', {
							a: 'modxTagHelper',
							name: name,
							type: type
						}, function(r) {
							if(r) {
								el.id = 'node' + id;
								el.dataset.contextmenu = r;
								modx.tree.showPopup(e, id, name)
							}
						});
						//console.log("name: " + name + ", type: " + type);
					}
					e.preventDefault()
				}
			},
			tabRow: {
				init: function() {
					var row = w.main.document.querySelectorAll('.tab-pane > .tab-row');
					for(var i = 0; i < row.length; i++) modx.main.tabRow.build(row[i]);
				},
				build: function(row) {
					var rowContainer = d.createElement('div'),
						sel = row.querySelector('.selected');
					rowContainer.className = 'tab-row-container';
					row.parentNode.insertBefore(rowContainer, row);
					rowContainer.appendChild(row);
					this.scroll(row, sel);
					w.main.onresize = function() {
						modx.main.tabRow.scroll(row, sel);
					};
					var p = d.createElement('i');
					p.className = 'fa fa-angle-left prev disable';
					if(sel && sel.previousSibling) p.classList.remove('disable');
					p.onclick = function(e) {
						e.stopPropagation();
						e.preventDefault();
						var sel = row.querySelector('.selected');
						if(sel.previousSibling) {
							sel.previousSibling.click();
							modx.main.tabRow.scroll(row, sel)
						}
					};
					rowContainer.appendChild(p);
					var n = d.createElement('i');
					n.className = 'fa fa-angle-right next disable';
					if(sel && sel.nextSibling) n.classList.remove('disable');
					n.onclick = function(e) {
						e.stopPropagation();
						e.preventDefault();
						var sel = row.querySelector('.selected');
						if(sel.nextSibling) {
							sel.nextSibling.click();
							modx.main.tabRow.scroll(row, sel)
						}
					};
					rowContainer.appendChild(n);
					row.onclick = function(e) {
						var sel = e.target.tagName === 'H2' ? e.target : (e.target.tagName === 'SPAN' ? e.target.parentNode : null);
						if(sel) {
							if(sel.previousSibling) this.parentNode.querySelector('i.prev').classList.remove('disable');
							else this.parentNode.querySelector('i.prev').classList.add('disable');
							if(sel.nextSibling) this.parentNode.querySelector('i.next').classList.remove('disable');
							else this.parentNode.querySelector('i.next').classList.add('disable');
							modx.main.tabRow.scroll(this, sel)
						}
					}
				},
				scroll: function(row, sel) {
					let b = row.querySelector('.selected'),
						c = 0,
						elms = row.querySelectorAll('.tab'),
						p = row.offsetParent.querySelector('.prev'),
						n = row.offsetParent.querySelector('.next');
					for(let i = 0; i < elms.length; i++) {
						elms[i].index = i;
						c += elms[i].offsetWidth
					}
					if((b.index < sel.index || b.index === sel.index) && row.scrollLeft > b.offsetLeft) {
						this.animate(row, 'scrollLeft', '', row.scrollLeft, b.offsetLeft - 1, 100)
					}
					if((b.index > sel.index || b.index === sel.index) && (b.offsetLeft + b.offsetWidth) > (row.offsetWidth + row.scrollLeft)) {
						this.animate(row, 'scrollLeft', '', row.scrollLeft, (b.offsetLeft - row.offsetWidth + b.offsetWidth), 100)
					}
					if(c > row.offsetWidth) {
						this.drag(row)
					}
				},
				drag: function(row) {
					row.onmousedown = function(e) {
						if(e.button === 0) {
							e.preventDefault();
							var x = e.clientX,
								f = row.scrollLeft,
								g = '';
							w.main.document.body.focus();
							this.onmousemove = w.main.document.onmousemove = function(e) {
								if(Math.abs(e.clientX - x) > 5) {
									e.stopPropagation();
									row.scrollLeft = f - (e.clientX - x);
									w.main.document.body.classList.add('drag');
									if(e.clientX - x > 0) g = 'right';
									else g = 'left'
								}
							};
							this.onmouseup = w.main.document.onmouseup = function(e) {
								e.stopPropagation();
								row.onmousemove = null;
								w.main.document.onmousemove = null;
								w.main.document.body.classList.remove('drag')
							}
						}
					}
					var x,
						g,
						f = row.scrollLeft;
					row.addEventListener('touchstart', function(e) {
						x = e.changedTouches[0].clientX;
						g = false;
						f = row.scrollLeft;
					}, false);
					row.addEventListener('touchmove', function(e) {
						var touch = e.changedTouches[0]
						if(Math.abs(touch.clientX - x) > 5) {
							e.stopPropagation();
							row.scrollLeft = f - (touch.clientX - x);
							w.main.document.body.classList.add('drag');
							if(e.clientX - x > 0) g = 'right';
							else g = 'left'
						}
						e.preventDefault()
					}, false);
					row.addEventListener('touchend', function(e) {
						if(g) {
							e.stopPropagation();
							row.touchmove = null;
						}
						w.main.document.body.classList.remove('drag')
					}, false);
				},
				animate: function(a, b, c, d, e, f) {
					var g = Date.now();
					var timer = 0;
					clearInterval(timer);
					timer = setInterval(function() {
						var i = Math.min(1, (Date.now() - g) / f);
						a[b] = (d + i * (e - d)) + c;
						if(1 === i) {
							clearInterval(timer)
						}
					}, 1)
				}
			},
			work: function() {
				d.getElementById('mainloader').classList.add('show')
			},
			stopWork: function() {
				d.getElementById('mainloader').classList.remove('show')
			},
			scrollWork: function() {
				var a = d.getElementById(modx.main.idFrame).contentWindow,
					b = localStorage.getItem('page_y'),
					c = localStorage.getItem('page_url');
				if(b === u) {
					localStorage.setItem('page_y', 0)
				}
				if(c === null) {
					c = a.location.search.substring(1)
				}
				if((modx.main.getQueryVariable('a', c) === modx.main.getQueryVariable('a', a.location.search.substring(1))) && (modx.main.getQueryVariable('id', c) === modx.main.getQueryVariable('id', a.location.search.substring(1)))) {
					a.scrollTo(0, b)
				}
				a.onscroll = function() {
					if(a.pageYOffset > 0) {
						localStorage.setItem('page_y', a.pageYOffset);
						localStorage.setItem('page_url', a.location.search.substring(1))
					}
				}
			},
			getQueryVariable: function(v, q) {
				var vars = q.split('&');
				for(var i = 0; i < vars.length; i++) {
					var p = vars[i].split('=');
					if(decodeURIComponent(p[0]) === v) {
						return decodeURIComponent(p[1])
					}
				}
			}
		},
		resizer: {
			dragElement: null,
			oldZIndex: 99,
			newZIndex: 999,
			left: modx.config.tree_width,
			id: 'resizer',
			switcher: 'hideMenu',
			background: 'rgba(0, 0, 0, 0.1)',
			mask: null,
			init: function() {
				modx.resizer.mask = d.createElement('div');
				modx.resizer.mask.id = 'mask_resizer';
				modx.resizer.mask.style.zIndex = modx.resizer.oldZIndex;
				d.getElementById(modx.resizer.id).onmousedown = modx.resizer.onMouseDown;
				d.getElementById(modx.resizer.id).onmouseup = modx.resizer.mask.onmouseup = modx.resizer.onMouseUp;
			},
			onMouseDown: function(e) {
				e = e || w.event;
				modx.resizer.dragElement = e.target !== null ? e.target : e.srcElement;
				if((e.buttons === 1 || e.button === 0) && modx.resizer.dragElement.id === modx.resizer.id) {
					modx.resizer.oldZIndex = modx.resizer.dragElement.style.zIndex;
					modx.resizer.dragElement.style.zIndex = modx.resizer.newZIndex;
					modx.resizer.dragElement.style.background = modx.resizer.background;
					localStorage.setItem('MODX_lastPositionSideBar', (modx.resizer.dragElement.offsetLeft > 0 ? modx.resizer.dragElement.offsetLeft : 0));
					d.body.appendChild(modx.resizer.mask);
					d.onmousemove = modx.resizer.onMouseMove;
					d.body.focus();
					d.body.classList.add('resizer_move');
					d.onselectstart = function() {
						return false
					};
					modx.resizer.dragElement.ondragstart = function() {
						return false
					};
					return false
				}
			},
			onMouseMove: function(e) {
				e = e || w.event;
				if(e.clientX > 0) {
					modx.resizer.left = e.clientX
				} else {
					modx.resizer.left = 0
				}
				modx.resizer.dragElement.style.left = modx.pxToRem(modx.resizer.left) + 'rem';
				d.getElementById('tree').style.width = modx.pxToRem(modx.resizer.left) + 'rem';
				d.getElementById('main').style.left = modx.pxToRem(modx.resizer.left) + 'rem';
				if(e.clientX < -2 || e.clientY < -2) {
					modx.resizer.onMouseUp(e)
				}
			},
			onMouseUp: function(e) {
				if(modx.resizer.dragElement !== null && e.button === 0 && modx.resizer.dragElement.id === modx.resizer.id) {
					if(e.clientX > 0) {
						d.body.classList.add('sidebar-opened');
						d.body.classList.remove('sidebar-closed');
						modx.resizer.left = e.clientX
					} else {
						d.body.classList.remove('sidebar-opened');
						d.body.classList.add('sidebar-closed');
						modx.resizer.left = 0
					}
					d.cookie = 'MODX_positionSideBar=' + modx.pxToRem(modx.resizer.left);
					modx.resizer.dragElement.style.zIndex = modx.resizer.oldZIndex;
					modx.resizer.dragElement.style.background = '';
					modx.resizer.dragElement.ondragstart = null;
					modx.resizer.dragElement = null;
					d.body.classList.remove('resizer_move');
					d.body.removeChild(modx.resizer.mask);
					d.onmousemove = null;
					d.onselectstart = null
				}
			},
			toggle: function() {
				var p = parseInt(d.getElementById('tree').offsetWidth) !== 0 ? 0 : (localStorage.getItem('MODX_lastPositionSideBar') ? parseInt(localStorage.getItem('MODX_lastPositionSideBar')) : modx.config.tree_width);
				modx.resizer.setWidth(p)
			},
			setWidth: function(a) {
				if(a > 0) {
					d.body.classList.add('sidebar-opened');
					d.body.classList.remove('sidebar-closed');
					localStorage.setItem('MODX_lastPositionSideBar', 0)
				} else {
					d.body.classList.remove('sidebar-opened');
					d.body.classList.add('sidebar-closed');
					localStorage.setItem('MODX_lastPositionSideBar', parseInt(d.getElementById('tree').offsetWidth))
				}
				d.cookie = 'MODX_positionSideBar=' + modx.pxToRem(a);
				d.getElementById('tree').style.width = modx.pxToRem(a) + 'rem';
				d.getElementById('resizer').style.left = modx.pxToRem(a) + 'rem';
				d.getElementById('main').style.left = modx.pxToRem(a) + 'rem'
			},
			setDefaultWidth: function() {
				modx.resizer.setWidth(modx.config.tree_width)
			}
		},
		tree: {
			ctx: null,
			rpcNode: null,
			itemToChange: null,
			selectedObjectName: null,
			selectedObject: 0,
			selectedObjectDeleted: 0,
			selectedObjectUrl: '',
			drag: false,
			init: function() {
				this.restoreTree()
			},
			draggable: function() {
				var els = d.querySelectorAll('#treeRoot a:not(.empty)');
				for(var i = 0; i < els.length; i++) {
					els[i].onmousedown = this.onmousedown;
					els[i].ondragstart = this.ondragstart;
					els[i].ondragenter = this.ondragenter;
					els[i].ondragover = this.ondragover;
					els[i].ondragleave = this.ondragleave;
					els[i].ondrop = this.ondrop;
				}
			},
			onmousedown: function(e) {
				if(e.ctrlKey) {
					this.parentNode.removeAttribute('draggable');
					return;
				} else {
					this.parentNode.draggable = true
				}
				modx.tree.itemToChange = this.parentNode.id;
				this.parentNode.ondragstart = modx.tree.ondragstart
			},
			ondragstart: function(e) {
				e.dataTransfer.effectAllowed = "all";
				e.dataTransfer.dropEffect = "all";
				e.dataTransfer.setData("text", this.id.substr(4));
			},
			ondragenter: function(e) {
				if(d.getElementById(modx.tree.itemToChange) === (this.parentNode.closest('#' + modx.tree.itemToChange) || this.parentNode)) {
					this.parentNode.className = '';
					e.dataTransfer.effectAllowed = "none";
					e.dataTransfer.dropEffect = "none";
					modx.tree.drag = false;
				} else {
					this.parentNode.className = 'dragenter';
					e.dataTransfer.effectAllowed = "copy";
					e.dataTransfer.dropEffect = "copy";
					modx.tree.drag = true;
				}
				e.preventDefault();
			},
			ondragover: function(e) {
				if(modx.tree.drag) {
					var a = e.clientY;
					var b = parseInt(this.getBoundingClientRect().top);
					var c = (a - b);
					if(c > this.offsetHeight / 1.51) {
						//this.parentNode.className = 'dragafter';
						this.parentNode.classList.add('dragafter');
						this.parentNode.classList.remove('dragbefore');
						this.parentNode.classList.remove('dragenter');
						e.dataTransfer.effectAllowed = "link";
						e.dataTransfer.dropEffect = "link";
					} else if(c < this.offsetHeight / 3) {
						//this.parentNode.className = 'dragbefore';
						this.parentNode.classList.add('dragbefore');
						this.parentNode.classList.remove('dragafter');
						this.parentNode.classList.remove('dragenter');
						e.dataTransfer.effectAllowed = "link";
						e.dataTransfer.dropEffect = "link";
					} else {
						//this.parentNode.className = 'dragenter';
						this.parentNode.classList.add('dragenter');
						this.parentNode.classList.remove('dragafter');
						this.parentNode.classList.remove('dragbefore');
						e.dataTransfer.effectAllowed = "copy";
						e.dataTransfer.dropEffect = "copy";
					}
				} else {
					e.dataTransfer.effectAllowed = "none";
					e.dataTransfer.dropEffect = "none";
					modx.tree.drag = false;
				}
				e.preventDefault()
			},
			ondragleave: function(e) {
				this.parentNode.className = '';
				this.parentNode.removeAttribute('draggable');
				e.preventDefault()
			},
			ondrop: function(e) {
				var el = d.getElementById(modx.tree.itemToChange),
					els = null,
					id = modx.tree.itemToChange.substr(4),
					parent = 0,
					menuindex = [],
					index = 0,
					level = 0,
					indent = el.firstChild.querySelector('.indent'),
					i = 0;
				indent.innerHTML = '';
				el.removeAttribute('draggable');
				if(this.parentNode.classList.contains('dragenter')) {
					parent = parseInt(this.parentNode.id.substr(4));
					level = parseInt(this.dataset.level) + 1;
					for(i = 0; i < level; i++) indent.innerHTML += '<i></i>';
					if(this.nextSibling) {
						if(this.nextSibling.innerHTML) {
							this.nextSibling.appendChild(el)
						} else {
							el.parentNode.removeChild(el)
						}
						els = this.parentNode.lastChild.children;
						for(i = 0; i < els.length; i++) menuindex[i] = els[i].id.substr(4);
					} else {
						el.parentNode.removeChild(el);
						d.querySelector('#node' + parent + ' .icon').innerHTML = (parseInt(this.dataset.private) ? modx.style.tree_folder_secure : modx.style.tree_folder)
					}
					modx.post(modx.MODX_SITE_URL + modx.MGR_DIR + '/media/style/' + modx.config.theme + '/ajax.php', {
						a: 'movedocument',
						id: id,
						parent: parent,
						menuindex: menuindex
					}, function() {
						modx.tree.restoreTree()
					});
					// :TODO проверка на открытый документ
					// index = menuindex.indexOf(id);
					// el = w.main.document.querySelector('#documentPane input[name=menuindex]');
					// if(el && index > 0) el.value = index;
					//console.log('id: ' + id + ', parent: ' + parent + ', menuindex: ' + menuindex);
				}
				if(this.parentNode.classList.contains('dragafter')) {
					parent = this.parentNode.parentNode.parentNode.id ? parseInt(this.parentNode.parentNode.parentNode.id.substr(4)) : 0;
					level = parseInt(this.dataset.level);
					for(i = 0; i < level; i++) indent.innerHTML += '<i></i>';
					this.parentNode.parentNode.insertBefore(el, this.parentNode.nextSibling);
					els = this.parentNode.parentNode.children;
					for(i = 0; i < els.length; i++) menuindex[i] = els[i].id.substr(4);
					modx.post(modx.MODX_SITE_URL + modx.MGR_DIR + '/media/style/' + modx.config.theme + '/ajax.php', {
						a: 'movedocument',
						id: id,
						parent: parent,
						menuindex: menuindex
					}, function() {
						modx.tree.restoreTree()
					});
					// :TODO проверка на открытый документ
					// index = menuindex.indexOf(id);
					// el = w.main.document.querySelector('#documentPane input[name=menuindex]');
					// if(el && index > 0) el.value = index;
					//console.log('id: ' + id + ', parent: ' + parent + ', menuindex: ' + menuindex);
				}
				if(this.parentNode.classList.contains('dragbefore')) {
					parent = this.parentNode.parentNode.parentNode.id ? parseInt(this.parentNode.parentNode.parentNode.id.substr(4)) : 0;
					level = parseInt(this.dataset.level);
					for(i = 0; i < level; i++) indent.innerHTML += '<i></i>';
					this.parentNode.parentNode.insertBefore(el, this.parentNode);
					els = this.parentNode.parentNode.children;
					for(i = 0; i < els.length; i++) menuindex[i] = els[i].id.substr(4);
					modx.post(modx.MODX_SITE_URL + modx.MGR_DIR + '/media/style/' + modx.config.theme + '/ajax.php', {
						a: 'movedocument',
						id: id,
						parent: parent,
						menuindex: menuindex
					}, function() {
						modx.tree.restoreTree()
					});
					// :TODO проверка на открытый документ
					// index = menuindex.indexOf(id);
					// el = w.main.document.querySelector('#documentPane input[name=menuindex]');
					// if(el && index > 0) el.value = index;
					//console.log('id: ' + id + ', parent: ' + parent + ', menuindex: ' + menuindex);
				}
				this.parentNode.removeAttribute('class');
				this.parentNode.removeAttribute('draggable');
				e.preventDefault();
			},
			toggleTheme: function(e) {
				if(e.currentTarget.classList.contains('rotate180')) {
					e.currentTarget.classList.remove('rotate180');
					d.body.classList.remove('dark');
					w.main.document.body.classList.remove('dark');
					d.cookie = 'MODX_themeColor='
				} else {
					e.currentTarget.classList.add('rotate180');
					d.body.classList.add('dark');
					w.main.document.body.classList.add('dark');
					d.cookie = 'MODX_themeColor=dark'
				}
			},
			toggleNode: function(e, id) {
				e = e || w.event;
				if(e.ctrlKey) return;
				e.stopPropagation();
				var el = d.getElementById('node' + id).firstChild;
				this.rpcNode = el.nextSibling;
				var toggle = el.querySelector('.toggle'),
					icon = el.querySelector('.icon');
				if(this.rpcNode.innerHTML === '') {
					if(toggle) toggle.innerHTML = el.dataset.iconCollapsed;
					icon.innerHTML = el.dataset.iconFolderOpen;
					var rpcNodeText = this.rpcNode.innerHTML,
						loadText = modx.lang.loading_doc_tree;
					modx.openedArray[id] = 1;
					if(rpcNodeText === "" || rpcNodeText.indexOf(loadText) > 0) {
						var folderState = this.getFolderState();
						d.getElementById('treeloader').classList.add('show');
						modx.get('index.php?a=1&f=nodes&indent=' + el.dataset.indent + '&parent=' + id + '&expandAll=' + el.dataset.expandall + folderState, function(r) {
							modx.tree.rpcLoadData(r);
							modx.tree.draggable()
						})
					}
					this.saveFolderState()
				} else {
					if(toggle) toggle.innerHTML = el.dataset.iconExpanded;
					icon.innerHTML = el.dataset.iconFolderClose;
					delete modx.openedArray[id];
					modx.animation.slideUp(this.rpcNode, 80, function() {
						this.innerHTML = ''
					});
					this.saveFolderState()
				}
				e.preventDefault()
			},
			rpcLoadData: function(a) {
				if(this.rpcNode !== null) {
					this.rpcNode.innerHTML = typeof a === 'object' ? a.responseText : a;
					this.rpcNode.loaded = true;
					if(this.rpcNode.id !== 'treeRoot') {
						modx.animation.slideDown(this.rpcNode, 80)
					}
					var el;
					d.getElementById('treeloader').classList.remove('show');
					if(this.rpcNode.id === 'treeRoot') {
						el = d.getElementById('binFull');
						if(el) this.showBin(true);
						else this.showBin(false)
					}
					el = d.getElementById('mx_loginbox');
					if(el) {
						modx.animation.slideUp(this.rpcNode, 80, function() {
							this.innerHTML = ''
						});
						w.location = 'index.php'
					}
				}
			},
			treeAction: function(e, id, title) {
				if(e.ctrlKey) return;
				var el = d.getElementById('node' + id).firstChild,
					treepageclick = parseInt(el.dataset.treepageclick),
					showchildren = parseInt(el.dataset.showchildren),
					openfolder = parseInt(el.dataset.openfolder);
				title = title || (el.dataset && el.dataset.titleEsc);
				if(tree.ca === "move") {
					try {
						this.setSelectedByContext(id);
						w.main.setMoveValue(id, title)
					} catch(oException) {
						alert(modx.lang.unable_set_parent)
					}
				}
				if(tree.ca === "open" || tree.ca === "") {
					if(id === 0) {
						w.main.location.href = "index.php?a=2"
					} else {
						var href = '';
						modx.setLastClickedElement(7, id);
						if(!isNaN(treepageclick) && isFinite(treepageclick)) {
							href = "index.php?a=" + treepageclick + "&r=1&id=" + id + (openfolder === 0 ? this.getFolderState() : '')
						} else {
							href = treepageclick;
						}
						if(openfolder === 2) {
							if(showchildren !== 1) {
								href = '';
							}
							this.toggleNode(e, id)
						}
						if(href) {
							if(e.shiftKey) {
								w.getSelection().removeAllRanges();
								modx.openWindow(href);
								this.restoreTree()
							} else {
								w.main.location.href = href;
								if(w.innerWidth < modx.minWidth) modx.resizer.toggle()
							}
						}
					}
					var el = d.querySelector('#node' + id + '>.node');
					modx.tree.setSelected(el)
				}
				if(tree.ca === "parent") {
					try {
						this.setSelectedByContext(id);
						w.main.setParent(id, title)
					} catch(oException) {
						alert(modx.lang.unable_set_parent)
					}
				}
				if(tree.ca === "link") {
					try {
						this.setSelectedByContext(id);
						w.main.setLink(id)
					} catch(oException) {
						alert(modx.lang.unable_set_link)
					}
				}
				e.preventDefault();
			},
			showPopup: function(e, id, title) {
				if(e.ctrlKey) return;
				e.preventDefault();
				var tree = d.getElementById('tree'),
					el = d.getElementById('node' + id) || e.target;
				if(el) {
					if(el.dataset.contextmenu) {
						e.target.dataset.toggle = '#contextmenu';
						modx.hideDropDown(e);
						this.ctx = d.createElement('div');
						this.ctx.id = 'contextmenu';
						this.ctx.className = 'dropdown-menu';
						d.getElementById(modx.frameset).appendChild(this.ctx);
						this.setSelectedByContext(id);
						var dataJson = JSON.parse(el.dataset.contextmenu);
						for(var key in dataJson) {
							if(dataJson.hasOwnProperty(key)) {
								var item = d.createElement('div');
								for(var k in dataJson[key]) {
									if(dataJson[key].hasOwnProperty(k)) {
										if(k.substring(0, 2) === 'on') {
											var onEvent = dataJson[key][k];
											item[k] = function(onEvent) {
												return function() {
													eval(onEvent)
												}
											}(onEvent)
										} else {
											item[k] = dataJson[key][k]
										}
									}
								}
								if(key.indexOf('header') === 0) item.className += ' menuHeader';
								if(key.indexOf('item') === 0) item.className += ' menuLink';
								if(key.indexOf('seperator') === 0 || key.indexOf('separator') === 0) item.className += ' seperator separator';
								this.ctx.appendChild(item)
							}
						}
						var bodyHeight = tree.offsetHeight - modx.config.menu_height;
						var x = e.clientX > 0 ? e.clientX : e.pageX;
						var y = e.clientY > 0 ? e.clientY : e.pageY;
						if(e.view.name === "main") {
							x += tree.offsetWidth
						} else {
							if(e.target.parentNode.parentNode.classList.contains('node')) {
								x += 50;
							}
						}
						if(x > e.view.innerWidth) {
							x = e.view.innerWidth - this.ctx.offsetWidth;
						}
						if(y + this.ctx.offsetHeight / 2 > bodyHeight) {
							y = bodyHeight - this.ctx.offsetHeight - 5
						} else if(y - this.ctx.offsetHeight / 2 < tree.offsetTop) {
							y = tree.offsetTop + 5
						} else {
							y = y - this.ctx.offsetHeight / 2
						}
						this.itemToChange = id;
						this.selectedObjectName = title;
						this.dopopup(this.ctx, x + 10, y)
					} else {
						el = el.firstChild;
						var ctx = d.getElementById('mx_contextmenu');
						e.target.dataset.toggle = '#mx_contextmenu';
						modx.hideDropDown(e);
						this.setSelectedByContext(id);
						var i4 = d.getElementById('item4'),
							i5 = d.getElementById('item5'),
							i8 = d.getElementById('item8'),
							i9 = d.getElementById('item9'),
							i10 = d.getElementById('item10'),
							i11 = d.getElementById('item11');
						if(modx.permission.publish_document === 1) {
							i9.style.display = 'block';
							i10.style.display = 'block';
							if(parseInt(el.dataset.published) === 1) i9.style.display = 'none';
							else i10.style.display = 'none'
						} else {
							i5.style.display = 'none'
						}
						if(modx.permission.delete_document === 1) {
							i4.style.display = 'block';
							i8.style.display = 'block';
							if(parseInt(el.dataset.deleted) === 1) {
								i4.style.display = 'none';
								i9.style.display = 'none';
								i10.style.display = 'none'
							} else {
								i8.style.display = 'none'
							}
						}
						if(parseInt(el.dataset.isfolder) === 1) i11.style.display = 'block';
						else i11.style.display = 'none';
						var bodyHeight = tree.offsetHeight + tree.offsetTop;
						var x = e.clientX > 0 ? e.clientX : e.pageX;
						var y = e.clientY > 0 ? e.clientY : e.pageY;
						if(y + ctx.offsetHeight / 2 > bodyHeight) {
							y = bodyHeight - ctx.offsetHeight - 5
						} else if(y - ctx.offsetHeight / 2 < tree.offsetTop) {
							y = tree.offsetTop + 5
						} else {
							y = y - ctx.offsetHeight / 2
						}
						if(e.target.parentNode.parentNode.classList.contains('node')) x += 50;
						this.itemToChange = id;
						this.selectedObjectName = title;
						this.dopopup(ctx, x + 10, y)
					}
					e.stopPropagation()
				}
			},
			dopopup: function(el, a, b) {
				if(this.selectedObjectName.length > 30) {
					this.selectedObjectName = this.selectedObjectName.substr(0, 30) + "..."
				}
				var f = d.getElementById("nameHolder");
				f.innerHTML = this.selectedObjectName;
				el.style.left = a + (modx.config.textdir ? '-190' : '') + "px";
				el.style.top = b + "px";
				setTimeout(function() {
					el.classList.add('show')
				}, 150)
			},
			menuHandler: function(a) {
				switch(a) {
					case 1:
						this.setActiveFromContextMenu(this.itemToChange);
						w.main.location.href = "index.php?a=3&id=" + this.itemToChange;
						break;
					case 2:
						this.setActiveFromContextMenu(this.itemToChange);
						w.main.location.href = "index.php?a=27&r=1&id=" + this.itemToChange;
						break;
					case 3:
						w.main.location.href = "index.php?a=4&pid=" + this.itemToChange;
						break;
					case 4:
						if(this.selectedObjectDeleted) {
							alert("'" + this.selectedObjectName + "' " + modx.lang.already_deleted)
						} else if(confirm("'" + this.selectedObjectName + "'\n\n" + modx.lang.confirm_delete_resource) === true) {
							w.main.location.href = "index.php?a=6&id=" + this.itemToChange
						}
						break;
					case 5:
						this.setActiveFromContextMenu(this.itemToChange);
						w.main.location.href = "index.php?a=51&id=" + this.itemToChange;
						break;
					case 6:
						w.main.location.href = "index.php?a=72&pid=" + this.itemToChange;
						break;
					case 7:
						if(confirm(modx.lang.confirm_resource_duplicate) === true) {
							w.main.location.href = "index.php?a=94&id=" + this.itemToChange
						}
						break;
					case 8:
						if(d.getElementById('node' + this.itemToChange).firstChild.dataset.deleted) {
							if(confirm("'" + this.selectedObjectName + "' " + modx.lang.confirm_undelete) === true) {
								w.main.location.href = "index.php?a=63&id=" + this.itemToChange
							}
						} else {
							alert("'" + this.selectedObjectName + "'" + modx.lang.not_deleted)
						}
						break;
					case 9:
						if(confirm("'" + this.selectedObjectName + "' " + modx.lang.confirm_publish) === true) {
							w.main.location.href = "index.php?a=61&id=" + this.itemToChange
						}
						break;
					case 10:
						if(this.itemToChange !== modx.config.site_start) {
							if(confirm("'" + this.selectedObjectName + "' " + modx.lang.confirm_unpublish) === true) {
								w.main.location.href = "index.php?a=62&id=" + this.itemToChange
							}
						} else {
							alert('Document is linked to site_start variable and cannot be unpublished!')
						}
						break;
					case 11:
						w.main.location.href = "index.php?a=56&id=" + this.itemToChange;
						break;
					case 12:
						w.open(d.getElementById('node' + this.itemToChange).firstChild.dataset.href, 'previeWin');
						break;
					default:
						alert('Unknown operation command.')
				}
			},
			setSelected: function(a) {
				var el = d.querySelector('#treeRoot .current');
				if(el) el.classList.remove('current');
				if(a) a.classList.add('current')
			},
			setActiveFromContextMenu: function(a) {
				var el = d.querySelector('#node' + a + '>.node');
				if(el) this.setSelected(el)
			},
			setSelectedByContext: function(a) {
				var el = d.querySelector('#treeRoot .selected');
				if(el) el.classList.remove('selected');
				el = d.querySelector('#node' + a + '>.node');
				if(el) el.classList.add('selected');
			},
			setItemToChange: function() {
				var a = d.getElementById(modx.main.idFrame).contentWindow,
					b = a.location.search.substring(1);
				if((parseInt(modx.main.getQueryVariable('a', b)) === 27 || parseInt(modx.main.getQueryVariable('a', b)) === 3) && modx.main.getQueryVariable('id', b)) {
					this.itemToChange = parseInt(modx.main.getQueryVariable('id', b))
				} else {
					this.itemToChange = null
				}
			},
			restoreTree: function() {
				console.log('modx.tree.restoreTree()');
				d.getElementById('treeloader').classList.add('show');
				this.setItemToChange();
				this.rpcNode = d.getElementById('treeRoot');
				modx.get('index.php?a=1&f=nodes&indent=1&parent=0&expandAll=2&id=' + this.itemToChange, function(r) {
					modx.tree.rpcLoadData(r);
					modx.tree.draggable()
				})
			},
			expandTree: function() {
				this.rpcNode = d.getElementById('treeRoot');
				d.getElementById('treeloader').classList.add('show');
				modx.get('index.php?a=1&f=nodes&indent=1&parent=0&expandAll=1&id=' + this.itemToChange, function(r) {
					modx.tree.rpcLoadData(r);
					modx.tree.saveFolderState();
					modx.tree.draggable()
				})
			},
			collapseTree: function() {
				this.rpcNode = d.getElementById('treeRoot');
				d.getElementById('treeloader').classList.add('show');
				modx.get('index.php?a=1&f=nodes&indent=1&parent=0&expandAll=0&id=' + this.itemToChange, function(r) {
					modx.openedArray = [];
					modx.tree.saveFolderState();
					modx.tree.rpcLoadData(r);
					modx.tree.draggable()
				})
			},
			updateTree: function() {
				this.rpcNode = d.getElementById('treeRoot');
				d.getElementById('treeloader').classList.add('show');
				var a = d.sortFrm;
				var b = 'a=1&f=nodes&indent=1&parent=0&expandAll=2&dt=' + a.dt.value + '&tree_sortby=' + a.sortby.value + '&tree_sortdir=' + a.sortdir.value + '&tree_nodename=' + a.nodename.value + '&id=' + this.itemToChange + '&showonlyfolders=' + a.showonlyfolders.value;
				modx.get('index.php?' + b, function(r) {
					modx.tree.rpcLoadData(r);
					modx.tree.draggable()
				})
			},
			getFolderState: function() {
				var a;
				if(modx.openedArray !== [0]) {
					a = "&opened=";
					for(var key in modx.openedArray) {
						if(modx.openedArray[key]) {
							a += key + "|"
						}
					}
				} else {
					a = "&opened="
				}
				return a
			},
			saveFolderState: function() {
				modx.get('index.php?a=1&f=nodes&savestateonly=1' + this.getFolderState())
			},
			showSorter: function(e) {
				e = e || w.event;
				var el = d.getElementById('floater');
				e.target.dataset.toggle = '#floater';
				el.classList.toggle('show');
				el.onclick = function(e) {
					e.stopPropagation()
				}
			},
			emptyTrash: function() {
				if(confirm(modx.lang.confirm_empty_trash) === true) {
					w.main.location.href = "index.php?a=64"
				}
			},
			showBin: function(a) {
				var el = d.getElementById('treeMenu_emptytrash');
				if(el) {
					if(a) {
						el.title = modx.lang.empty_recycle_bin;
						el.classList.remove('disabled');
						el.innerHTML = modx.style.empty_recycle_bin;
						el.onclick = function() {
							modx.tree.emptyTrash()
						}
					} else {
						el.title = modx.lang.empty_recycle_bin_empty;
						el.classList.add('disabled');
						el.innerHTML = modx.style.empty_recycle_bin_empty;
						el.onclick = null
					}
				}
			},
			unlockElement: function(a, b, c) {
				var m = modx.lockedElementsTranslation.msg.replace('[+id+]', b).replace('[+element_type+]', modx.lockedElementsTranslation['type' + a]);
				if(confirm(m) === true) {
					modx.get('index.php?a=67&type=' + a + '&id=' + b, function(r) {
						if(parseInt(r) === 1) c.parentNode.removeChild(c);
						else alert(r)
					})
				}
			},
			resizeTree: function() {
			},
			reloadElementsInTree: function() {
				modx.get('index.php?a=1&f=tree', function(r) {
					savePositions();
					var div = d.createElement('div');
					div.innerHTML = r;
					var tabs = div.getElementsByClassName('tab-page');
					var el, p;
					for(var i = 0; i < tabs.length; i++) {
						if(tabs[i].id !== 'tabDoc') {
							el = tabs[i].getElementsByClassName('panel-group')[0];
							el.style.display = 'none';
							el.classList.add('clone');
							p = d.getElementById(tabs[i].id);
							r = p.getElementsByClassName('panel-group')[0];
							p.insertBefore(el, r)
						}
					}
					setRememberCollapsedCategories();
					for(var i = 0; i < tabs.length; i++) {
						if(tabs[i].id !== 'tabDoc') {
							el = d.getElementById(tabs[i].id).getElementsByClassName('panel-group')[1];
							el.remove();
							el = d.getElementById(tabs[i].id).getElementsByClassName('panel-group')[0];
							el.classList.remove('clone');
							el.style.display = 'block'
						}
					}
					loadPositions();
					initQuicksearch('tree_site_templates_search', 'tree_site_templates');
					var at = d.querySelectorAll('#tree .accordion-toggle');
					for(var i = 0; i < at.length; i++) {
						at[i].onclick = function(e) {
							e.preventDefault();
							var thisItemCollapsed = $(this).hasClass("collapsed");
							if(e.shiftKey) {
								var toggleItems = $(this).closest(".panel-group").find("> .panel .accordion-toggle");
								var collapseItems = $(this).closest(".panel-group").find("> .panel > .panel-collapse");
								if(thisItemCollapsed) {
									toggleItems.removeClass("collapsed");
									collapseItems.collapse("show")
								} else {
									toggleItems.addClass("collapsed");
									collapseItems.collapse("hide")
								}
								toggleItems.each(function() {
									var state = $(this).hasClass("collapsed") ? 1 : 0;
									setLastCollapsedCategory($(this).data("cattype"), $(this).data("catid"), state)
								});
								writeElementsInTreeParamsToStorage()
							} else {
								$(this).toggleClass("collapsed");
								$($(this).attr("href")).collapse("toggle");
								var state = thisItemCollapsed ? 0 : 1;
								setLastCollapsedCategory($(this).data("cattype"), $(this).data("catid"), state);
								writeElementsInTreeParamsToStorage()
							}
						}
					}
				})
			}
		},
		setLastClickedElement: function(a, b) {
			localStorage.setItem('MODX_lastClickedElement', '[' + parseInt(a) + ',' + parseInt(b) + ']')
		},
		removeLocks: function() {
			if(confirm(modx.lang.confirm_remove_locks) === true) {
				w.main.location.href = "index.php?a=67"
			}
		},
		openCredits: function() {
			w.main.location.href = "index.php?a=18";
			setTimeout('modx.main.stopWork()', 2000)
		},
		keepMeAlive: function() {
			modx.get('includes/session_keepalive.php?tok=' + d.getElementById('sessTokenInput').value + '&o=' + Math.random(), function(r) {
				r = JSON.parse(r);
				if(r.status !== 'ok') w.location.href = 'index.php?a=8'
			})
		},
		updateMail: function(a) {
			try {
				if(a) {
					this.post('index.php', {
						updateMsgCount: true
					}, function(r) {
						var c = r.split(','),
							el = d.getElementById('msgCounter');
						if(c[0] > 0) {
							if(el) {
								el.innerHTML = c[0];
								el.style.display = 'block'
							}
						} else {
							if(el) el.style.display = 'none'
						}
						if(c[1] > 0) {
							el = d.getElementById('newMail');
							if(el) {
								el.innerHTML = '<a href="index.php?a=10" target="main">' + modx.style.email + modx.lang.inbox + ' (' + c[0] + ' / ' + c[1] + ')</a>';
								el.style.display = 'block'
							}
						}
						if(modx.config.mail_check_timeperiod > 0) setTimeout('modx.updateMail(true)', 1000 * modx.config.mail_check_timeperiod)
					})
				}
			} catch(oException) {
				setTimeout('modx.updateMail(true)', 1000 * modx.config.mail_check_timeperiod)
			}
		},
		openWindow: function(a) {
			if(typeof a !== 'object') {
				a = {
					"url": a
				}
			}
			if(!a.width) a.width = parseInt(w.innerWidth * 0.9) + 'px';
			if(!a.height) a.height = parseInt(w.innerHeight * 0.8) + 'px';
			if(!a.left) a.left = parseInt(w.innerWidth * 0.05) + 'px';
			if(!a.top) a.top = parseInt(w.innerHeight * 0.1) + 'px';
			if(!a.title) a.title = Math.floor((Math.random() * 999999) + 1);
			if(a.url) {
				if(this.plugins.EVOmodal === 1) {
					top.EVO.modal.show(a)
				} else {
					w.open(a.url, a.title, 'width=' + a.width + ',height=' + a.height + ',top=' + a.top + ',left=' + a.left + ',toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=no')
				}
			}
		},
		getWindowDimension: function() {
			var a = 0,
				b = 0,
				c = d.documentElement,
				e = d.body;
			if(typeof(w.innerWidth) === 'number') {
				a = w.innerWidth;
				b = w.innerHeight
			} else if(c && (c.clientWidth || c.clientHeight)) {
				a = c.clientWidth;
				b = c.clientHeight
			} else if(e && (e.clientWidth || e.clientHeight)) {
				a = e.clientWidth;
				b = e.clientHeight
			}
			return {
				'width': a,
				'height': b
			}
		},
		hideDropDown: function(e) {
			e = e || w.event || w.main.event;
			if(tree.ca === "open" || tree.ca === "") {
				modx.tree.setSelectedByContext();
			}
			if(modx.tree.ctx !== null) {
				d.getElementById(modx.frameset).removeChild(modx.tree.ctx);
				modx.tree.ctx = null
			}
			if(!(/dropdown\-item/.test(e.target.className))
			//&& !(e && ("click" === e.type && /form|label|input|textarea|select/i.test(e.target.tagName)))
			) {
				var els = d.querySelectorAll('.dropdown'),
					n = null,
					t = e.target || e.target.parentNode;
				if(t.dataset.toggle) n = d.querySelector(t.dataset.toggle);
				else if(t.classList.contains('dropdown-toggle')) n = t.offsetParent;
				for(var i = 0; i < els.length; i++) {
					if(n !== els[i])
						els[i].classList.remove('show')
				}
				els = w.main.document.querySelectorAll('.dropdown');
				for(var i = 0; i < els.length; i++) {
					if(n !== els[i])
						els[i].classList.remove('show')
				}
			}
		},
		XHR: function() {
			return ('XMLHttpRequest' in w) ? new XMLHttpRequest : new ActiveXObject('Microsoft.XMLHTTP');
		},
		get: function(a, b, c) {
			var x = this.XHR();
			x.open('GET', a, true);
			x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
			if(c) x.responseType = c;
			x.onload = function() {
				if(this.status === 200 && typeof b === 'function') {
					return b(this.response)
				}
			};
			x.send()
		},
		post: function(a, b, c) {
			var x = this.XHR(),
				f = '';
			if(typeof b === 'function') {
				c = b;
			} else if(typeof b === 'object') {
				var e = [],
					i = 0,
					k;
				for(k in b) {
					if(b.hasOwnProperty(k)) e[i++] = k + '=' + b[k];
				}
				f = e.join('&')
			} else if(typeof b === 'string') {
				f = b;
			}
			x.open('POST', a, true);
			x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
			x.setRequestHeader('X-REQUESTED-WITH', 'XMLHttpRequest');
			x.onload = function() {
				if(this.readyState === 4 && c !== u) {
					return c(this.response)
				}
			};
			x.send(f)
		},
		animation: {
			duration: 300,
			fadeIn: function(a, b, c) {

			},
			fadeOut: function(a, b, c) {

			},
			slideUp: function(a, b, c) {
				if(!a) return;
				if(a.tagName) {
					if(typeof parseInt(b) === 'number' && parseInt(b) >= 0) b = parseInt(b);
					else if(typeof b === 'function') c = b, b = this.duration;
					else b = this.duration;
					var h = a.offsetHeight;
					a.style.overflow = 'hidden';
					b += (h / 1000) * b;
					this.animate(a.firstChild, 'marginTop', 'px', 0, -h, b, function() {
						a.removeAttribute('style');
						return c ? c.call(a) : ''
					}, 'slide')
				} else if(typeof a === 'string') {
					var els = d.querySelectorAll(a);
					for(var i = 0; i < els.length; i++) {
						modx.animation.slideUp(els[i], b, c)
					}
				}
			},
			slideDown: function(a, b, c) {
				if(!a) return;
				if(a.tagName) {
					if(typeof parseInt(b) === 'number' && parseInt(b) >= 0) b = parseInt(b);
					else if(typeof b === 'function') (c = b, b = this.duration);
					else b = this.duration;
					var h = a.offsetHeight;
					a.style.overflow = 'hidden';
					a.firstChild.style.marginTop = -h + 'px';
					b += (h / 1000) * b;
					this.animate(a.firstChild, 'marginTop', 'px', -h, 0, b, (function() {
						a.removeAttribute('style');
						return c ? c.call(a) : '';
					}), 'slide')
				} else if(typeof a === 'string') {
					var els = d.querySelectorAll(a);
					for(var i = 0; i < els.length; i++) {
						modx.animation.slideDown(els[i], b, c)
					}
				}
			},
			animate: function(a, b, c, d, e, f, k, l) {
				if(!a) return;
				var g = Date.now();
				clearInterval((!a.timers ? (a.timers = [], a.timers[l] = 0) : a.timers[l]));
				a.timers[l] = setInterval(function() {
					var i = Math.min(1, (Date.now() - g) / f);
					a.style[b] = (d + i * (e - d)) + c;
					1 === i ? (clearInterval(a.timers[l]), k()) : ''
				}, 1)
			}
		},
		pxToRem: function(a) {
			return a / parseInt(w.getComputedStyle(d.documentElement).fontSize)
		}
	});
	w.mainMenu = {};
	w.mainMenu.stopWork = function() {
		modx.main.stopWork()
	};
	w.mainMenu.work = function() {
		modx.main.work()
	};
	w.mainMenu.reloadtree = function() {
		//console.log('mainMenu.reloadtree()');
		setTimeout('modx.tree.restoreTree()', 50)
	};
	w.mainMenu.startrefresh = function(a) {
		console.log('mainMenu.startrefresh(' + a + ')');
		if(a === 1) {
			modx.tree.restoreTree()
		}
		if(a === 2) {
			modx.tree.restoreTree()
		}
		if(a === 9) {
			modx.tree.restoreTree()
		}
		if(a === 10) {
			w.location.href = "../" + modx.MGR_DIR
		}
	};
	w.mainMenu.startmsgcount = function(a, b, c) {
		modx.updateMail(c)
	};
	w.tree = {};
	w.tree.ca = 'open';
	w.tree.document = document;
	w.tree.saveFolderState = function() {
	};
	w.tree.updateTree = function() {
		//console.log('tree.updateTree()');
		modx.tree.updateTree()
	};
	w.tree.restoreTree = function() {
		//console.log('tree.restoreTree()');
		modx.tree.restoreTree()
	};
	w.tree.reloadElementsInTree = function() {
		//console.log('tree.reloadElementsInTree()');
		modx.tree.reloadElementsInTree()
	};
	w.tree.resizeTree = function() {
		console.log('tree.resizeTree() off')
	};
	w.onbeforeunload = function() {
		var a = d.getElementById(modx.main.idFrame).contentWindow;
		if(parseInt(modx.main.getQueryVariable('a', a.location.search.substring(1))) === 27) {
			modx.get('index.php?a=67&type=7&id=' + modx.main.getQueryVariable('id', a.location.search.substring(1)));
		}
	};
	d.addEventListener('DOMContentLoaded', function() {
		modx.init()
	})
})
(typeof jQuery !== 'undefined' ? jQuery : '', window, document, undefined);

function setLastClickedElement(a, b) {
	modx.setLastClickedElement(a, b)
}

function reloadElementsInTree() {
	modx.tree.reloadElementsInTree()
}

(function() {
	if(!Element.prototype.closest) {
		Element.prototype.closest = function(a) {
			var b = this,
				c, d;
			['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'].some(function(fn) {
				if(typeof document.body[fn] === 'function') {
					c = fn;
					return true
				}
				return false
			});
			if(b && b[c](a)) return b;
			while(b) {
				d = b.parentElement;
				if(d && d[c](a)) return d;
				b = d
			}
			return null;
		}
	}
})();
