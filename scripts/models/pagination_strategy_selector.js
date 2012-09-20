
// Description: Chooses a pagination strategy

// REFACTORING CANDIDATE: There is an issue here that is a bit hidden. Having this pagination strategy model attached to the 
//   epub makes sense in that each spine item within an epub can be either reflowable or fixed. As such, when navigating through
//   the epub, a decisions as to the type of pagination view must be made dynamically. However, at the moment, while it appears that
//   this is how the pagination strategy is set up, in actual fact, an entire fixed layout epub is rendered based on the type of spine item
//   found at the current spine_position. Since all the other spine items are then rendered assuming they are also fixed layout, the 
//   pagination strategy is never called again when navigating to the other (possibly reflowable) spine items. This will have to be addressed
//   at some point. 

Readium.Models.PaginationStrategySelector = Backbone.Model.extend({

	renderToLastPage: false,

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //	

	initialize: function() {
		var self = this;
		this.model = this.get("book");
		this.model.on("change:should_scroll", function() { self.renderSpineItems(); });
		this.zoomer = new Readium.Views.FixedLayoutBookZoomer();
	},

	// Description: Determine what the current spine item is and render it
	//   Updates which spine items have been rendered in an array of rendered spine items
	renderSpineItems: function(renderToLast, hashFragmentId) {
		var book = this.model;
		var that = this;
		var rendered_spine_positions = [];

		// clean up the old view if there is one
		if (this.v) {
			this.v.destruct();
		}

		// Spine items as found in the package document can have attributes that override global settings for the ebook. This 
		// requires checking/creating the correct pagination strategy for each spine item
		var spineItem = book.getCurrentSection();
		// A scrolling epub
		if (this.shouldScroll()) {

				this.v = new Readium.Views.InjectedScrollingPaginationView({model: book, zoomer: this.zoomer});
		}
		// A reflowable epub
		else {

			this.v = new Readium.Views.InjectedReflowablePaginationView({model: book, zoomer: this.zoomer});
		}

		this.rendered_spine_positions = this.v.render(!!renderToLast, hashFragmentId);
		return this.rendered_spine_positions;
	},

	shouldScroll: function() {
		return !!this.model.get("should_scroll");
	}

});