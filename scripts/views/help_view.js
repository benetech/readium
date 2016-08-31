Readium.Views.HelpView = Backbone.View.extend({

	el: '#viewer-help-modal',

	initialize: function() {
		console.log("Initializing Help Modal.");
		$('#help-btn').attr('aria-pressed', 'false');
		$('#viewer-help-modal').on('shown', function(){
			$('#help-heading').focus();
			setTimeout(function(){
				$('#help-btn').attr('aria-pressed', 'true');
			}, 1);
		}).on('hidden', function(){
			setTimeout(function(){
				$('#help-btn').attr('aria-pressed', 'false').focus();
			}, 1);
		});
	},

	events: {
    	"click #cancel-help-but": 	"cancelHelp"
  	},

	render: function() {
		return this;
	},

  	cancelHelp: function(e) {
  		this.$el.modal('hide');
		$('#help-btn').focus();
  	}
});