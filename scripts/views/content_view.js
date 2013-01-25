Readium.Views.ContentView = Backbone.View.extend({

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

	el: "#readium-content",

	initialize: function(options) {
		this.page_template = Handlebars.templates.injected_scrolling_page_template;

		// if this book does right to left pagination we need to set the
		// offset on the right
		if(this.model.epub.get("page_prog_dir") === "rtl") {
			this.offset_dir = "right";
		}
		else {
			this.offset_dir = "left";
		}

		this.trackScrolling = true;

		this.model.on("repagination_event", this.windowSizeChangeHandler, this);
		this.model.on("change:display_page_numbers", this.pageNumberCallback, this);
		this.model.on("change:font_size", this.fontSizeCallback, this);
		this.model.on("change:current_theme", this.setTheme, this);
		this.model.on("change:current_margin", this.marginCallback, this);

	},

	render: function(hashFragmentId) {
		var that = this;
		if (this.model.getCurrentSection().content == null) {
			BookshareUtils.raiseSystemAlert('loading_content');
			this.model.getCurrentSection().fetch({success:function(model, response) { BookshareUtils.dismissSystemAlert(); that.renderInternal(hashFragmentId);}});
		} else {
			this.renderInternal(hashFragmentId);
		}
		return [this.model.get("spine_position")];
	},

	renderInternal: function(hashFragmentId) {
		var that = this;
		var json = this.model.getCurrentSection().toJSON();
		var xhtml = this.model.getCurrentSection().content;
		var body = xhtml.children[1];

		// clear
		this.resetEl();

		// append body children
		for (var i = 0; i < body.childNodes.length; i++) {
			that.el.appendChild(body.childNodes[i].cloneNode(true));
		}

		that.adjustContentDiv();
		that.divSetup();
		that.setTheme();
		that.setFontSize();
		that.el.onscroll = that.makeScrollHandler();

		setTimeout(
			function() {
				if (hashFragmentId) {
					that.goToHashFragment(hashFragmentId);
				} else {

					if (that.model.get('reading_position') != null) {
						that.goToReadingPosition();
					} else {
						that.el.scrollTop = 0;
						// force call on scroll handler
						that.el.onscroll();
					}
				}
			}, 250);
	},

	adjustContentDiv: function() {
		this.setDivSize();
	},

	setDivSize: function() {
		var width = this.getDivWidth().toString() + "px";
		var height = this.getDivHeight().toString() + "px";

		this.$el.attr("width", width);
		this.$el.attr("height", height);
		this.$el.css("width", width);
		this.$el.css("height", height);
	},

	getDivWidth: function() {
		var width;
		var margin = this.model.get("current_margin");
		switch (margin) {
			case 1: width = 0.95; break;
			case 2: width = 0.85; break;
			case 3: width = 0.75; break;
			case 4: width = 0.65; break;
			default: width = 0.55; break;
		}
		
		return Math.floor( $('#readium-content-wrapper').width() * width );
	},

	getDivHeight: function() {
		return $('#readium-content-wrapper').height();
	},

	getBoundingRect: function() {
		return this.el.getBoundingClientRect();
	},

	setFontSize: function() {
		var size = this.model.get("font_size") / 10;
		this.$el.css("font-size", size + "em");
	},

	windowSizeChangeHandler: function() {
		this.adjustContentDiv();
		this.goToReadingPosition();
	},
    
	marginCallback: function() {
		this.adjustContentDiv();
		this.goToReadingPosition();
	},

	pageNumberCallback: function() {
		this.togglePageNumbers();
		this.goToReadingPosition();
	},

	fontSizeCallback: function() {
		this.setFontSize();
		this.goToReadingPosition();
	},

	goToHashFragment: function(hashFragmentId) {
		window.document.location.hash = hashFragmentId;
	},

	keepInCenter: function(elem) {
		var f = this.getFrame();
		var h = this.getFrameHeight();
		var top = Number(elem.style.top.replace('px', ''));
		var bottom = top + Number(elem.style.height.replace('px', ''));

		// continuous scrolling
		f.contentWindow.scrollTo(0, top - Math.round(0.25 * h));

		// pagey scrolling
		/*
		if (bottom - f.contentWindow.scrollY > h) {
			f.contentWindow.scrollTo(0, top);
		}
		*/
	},

	goToReadingPosition: function() {
		if (this.model.get("reading_position") != null) {
			var focEl = this.$el.find(this.model.get("reading_position"));
			if (focEl.length > 0) {
				this.trackScrolling = false;
				this.el.scrollTop = focEl[0].getClientRects()[0].top - this.getBoundingRect().top;
				this.trackScrolling = true;
			}
		}
	},

	makeScrollHandler: function() {
		var that = this;
		return function(evt) {
			if (that.trackScrolling && !!that.model.get('track_position')) {
				var el = BookshareUtils.findTopElement(that);
				that.model.set('reading_position', BookshareUtils.getSelectorForNearestElementWithId(el));
			}
		};
	},

	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" HELPERS                                                                   //
	// ------------------------------------------------------------------------------------ //

	// Description: sometimes these views hang around in memory before
	//   the GC's get them. we need to remove all of the handlers
	//   that were registered on the model
	destruct: function() {

		this.model.off("repagination_event", this.windowSizeChangeHandler);
		this.model.off("change:display_page_numbers", this.pageNumberCallback);
		this.model.off("change:font_size", this.fontSizeCallback);
		this.model.off("change:current_theme", this.setTheme);
		this.model.off("change:current_margin", this.marginCallback);

		// remove the scroll handler
		this.el.onscroll = null;
	},

    divSetup: function() {
		this.applySwitches( this.el );
        this.togglePageNumbers();
        this.injectLinkHandler();
	},
	
	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" HELPERS                                                                   //
	// ------------------------------------------------------------------------------------ //

	// Description: Handles clicks of anchor tags by navigating to
	// the proper location in the epub spine, or opening
	// a new window for external links
	linkClickHandler: function(e) {
		e.preventDefault();
		
		var href = $(e.currentTarget).attr("href");
		if(href.match(/^http(s)?:/)) {
			window.open(href);
		} else {
			this.model.goToHref(href);
			var splitUrl = BookshareUtils.getSplitUrl(href);
		}
	},
	
	// Description: Parse the epub "switch" tags and hide
	// cases that are not supported
	applySwitches: function(dom) {

		// helper method, returns true if a given case node
		// is supported, false otherwise
		var isSupported = function(caseNode) {

			var ns = caseNode.attributes["required-namespace"];
			if(!ns) {
				// the namespace was not specified, that should
				// never happen, we don't support it then
				console.log("Encountered a case statement with no required-namespace");
				return false;
			}
			// all the xmlns's that readium is known to support
			// TODO this is going to require maintanence
			var supportedNamespaces = ["http://www.w3.org/1998/Math/MathML"];
			return _.include(supportedNamespaces, ns);
		};

		$('switch', dom).each(function(ind) {
			
			// keep track of whether or now we found one
			var found = false;

			$('case', this).each(function() {

				if( !found && isSupported(this) ) {
					found = true; // we found the node, don't remove it
				}
				else {
					$(this).remove(); // remove the node from the dom
				}
			});

			if(found) {
				// if we found a supported case, remove the default
				$('default', this).remove();
			}
		})
	},

	togglePageNumbers: function () {
		var that = this;
		this.$el.find(".bksPageNumber").each(
			function(idx, el) {
				if (that.model.get("display_page_numbers")) {
					el.textContent = el.getAttribute("title");
					$(el).addClass("bksPageNumberOn");
				} else {
					while (el.hasChildNodes()) {
						el.removeChild(el.childNodes[0]);
					}
					$(el).removeClass("bksPageNumberOn");
				}
			}
		);
	},

    injectLinkHandler: function() {
    	var that = this;
    	$('a', this.el).click(function(e) {
    		that.linkClickHandler(e)
    	});
    },

	setTheme: function() {
		var theme = this.model.get("current_theme");
		var wrapper = $('#readium-content-wrapper');
		wrapper.removeClass(this.model.previous("current_theme"));
		wrapper.addClass(theme);
	},

	resetEl: function() {
		// nuke the kids
		while (this.el.hasChildNodes()) {
			this.el.removeChild(this.el.childNodes[this.el.childNodes.length - 1]);
		}
	},

	events: {
		"swipeleft": function(e) {
			e.preventDefault();
			this.model.goRight();			
		},

		"swiperight": function(e) {
			e.preventDefault();
			this.model.goLeft();			
		}

	}

});