Readium.Views.ViewerApplicationView = Backbone.View.extend({

	el: 'body',

	initialize: function() {
		// map fullscreen methods
		var that = this;
		for (var i = 0; i < Modernizr._domPrefixes.length; i++) {
			if (document.documentElement[Modernizr._domPrefixes[i] + 'RequestFullScreen'] != null) {
				this.model.set("supports_full_screen", true);
				this.requestFullscreen = document.documentElement[Modernizr._domPrefixes[i] + 'RequestFullScreen'];
				this.cancelFullscreen = document[Modernizr._domPrefixes[i] + 'CancelFullScreen'];

				// god I hate inconsistent camelcase
				var fsElName = Modernizr._domPrefixes[i];
				if (document[fsElName + 'FullscreenElement'] !== undefined) {
					fsElName = fsElName + 'FullscreenElement';
				} else if (document[fsElName + 'FullScreenElement'] !== undefined) {
					fsElName = fsElName + 'FullScreenElement';
				}
				this.getFullscreenElement = function() { return document[fsElName]};

				$(document).bind(
					Modernizr._domPrefixes[i] + 'fullscreenchange',
					function () {
						if (that.getFullscreenElement() == null) {
							that.model.set("full_screen", false);
						} else {
							that.model.set("full_screen", true);
						}
					}
				);
				break;
			}
		}
		
		// event handlers
		this.model.on("change:full_screen", this.toggleFullscreen, this);
		this.model.on("change:current_theme", this.renderTheme, this);
		this.model.on("change:toc_visible", this.renderTocVisible, this);

		this.optionsView = new Readium.Views.OptionsView({model: this.model.options});
		this.optionsView.render();
		
		this.helpView = new Readium.Views.HelpView({model: _epubController, parentView: this});
		this.helpView.render();

		// the top bar
		this.toolbar = new Readium.Views.ToolbarView({model: _epubController, parentView: this});
		this.toolbar.render();

		// the table of contents
		this.model.on("change:has_toc", this.init_toc, this);

		this.addGlobalEventHandlers();

		Acc.title = this.model.get('title') + ', by ' + this.model.get('author');
	},

	toggleFullscreen: function() {
		if(this.model.get("full_screen")) {
			this.requestFullscreen.call(document.documentElement);
		}
		else {
			this.cancelFullscreen.call(document);
		}
	},

	addGlobalEventHandlers: function() {
		var book = this.model;
		var that = this;
		window.onresize = function(event) {
			book.trigger("repagination_event");
		}

		$(document).keydown(function(e) {
			if (!that.allowAccessKey()) return;
			if(e.which == 39) {
				that.model.goRight();
			}
							
			if(e.which == 37) {
				that.model.goLeft();
			}
		});

		$("#readium-book-view-el").on("swipeleft", function(e) {
			if (!that.allowAccessKey()) return;
			e.preventDefault();
			that.model.goRight();			
		});

		$("#readium-book-view-el").on("swiperight", function(e) {
			if (!that.allowAccessKey()) return;
			e.preventDefault();
			that.model.goLeft();
		});
	},
	
	allowAccessKey: function() {
		if ($('#viewer-settings-modal').is(":visible") || $('#viewer-help-modal').is(":visible")) {
			return false;
		}
		return true;
	},

	render: function() {
		// right now we dont do anything but 
		// convention is to return this from render
		this.renderTheme();
		this.renderTocVisible();
		return this; 
	},

	renderTheme: function() {
		var theme = this.model.get("current_theme");
		this.$el.toggleClass("default-theme", "default-theme" === theme);
		this.$el.toggleClass("night-theme", "night-theme" === theme);
		this.$el.toggleClass("parchment-theme", "parchment-theme" === theme);
		this.$el.toggleClass("ballard-theme", "ballard-theme" === theme);
		this.$el.toggleClass("vancouver-theme", "vancouver-theme" === theme);

		this.$("#readium-book-view-el").toggleClass("default-theme", "default-theme" === theme);
		this.$("#readium-book-view-el").toggleClass("night-theme", "night-theme" === theme);
		this.$("#readium-book-view-el").toggleClass("parchment-theme", "parchment-theme" === theme);
		this.$("#readium-book-view-el").toggleClass("ballard-theme", "ballard-theme" === theme);
		this.$("#readium-book-view-el").toggleClass("vancouver-theme", "vancouver-theme" === theme);
	},

	renderTocVisible: function() {
		var vis = this.model.get("toc_visible");
		$('#toggle-toc-btn').attr('aria-pressed', vis ? 'true' : 'false');
		return this;
	},

	init_toc: function() {
		if( this.model.get("has_toc") ) {
			var toc_item = this.model.getToc();			
			this.toc = toc_item.TocView();
			toc_item.fetch();
		}
	},	
	
	events: {
		"click #prev-section-button": 	function() { 
			this.model.goLeft();
		},
		"click #next-section-button": 	function() { 
			this.model.goRight();
		}
  	}
});