$(function() {
	var ls = {
		getItem: function(key) {
			return JSON.parse(localStorage.getItem(key));
		},
		
		setItem: function(key,value) {
			localStorage.setItem(key, JSON.stringify(value));
		}
	}
	
	window.Card = Backbone.Model.extend({
		defaults: {
			value: 0,
			selected: false,
			matched: false
		},
	
		toggle: function() {
			if ( !this.get('matched')
			&& ( Cards.selected().length < $('#cardsperset').val() || this.get('selected') ) 
			){
				this.set({selected: !this.get('selected')});
			}
		}
	});
		
	window.CardView = Backbone.View.extend({
		tagName: 'div',
		
		className: 'inline',
		
		template: _.template($('#card-template').html()),
		
		events: {
			'click ' : 'toggleSelected'
		},
		
		initialize: function() {
			this.model.bind('change', _.bind(this.render, this));
		},
		
		render: function() {
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		},
	    
		toggleSelected: function() {
			this.model.toggle();
		}
		
	});
	
	window.CardList = Backbone.Collection.extend({
		model: Card,
			
		matched: function() {
			return this.filter(function(card) { return card.get('matched'); });
		},
		
		selected: function() {
			return this.filter(function(card) { return card.get('selected'); });
		},
		
		remaining: function() {
			return this.without.apply(this, this.matched());
		},
		
		hasMatch: function() {
			var selectedcards = this.selected();
			var values = _.map(selectedcards, function(card) {
				return card.get('value'); 
			});
			if ( ($('#cardsperset').val() == selectedcards.length) && (1 == _.uniq(values).length) ) {
				for (i in selectedcards) {
					selectedcards[i].set({matched:true});
					selectedcards[i].set({selected:false}, {silent:true});
				}
				return true;
			} else {
				return false;
			}
		}
	})
	
	window.AppView = Backbone.View.extend({
		el: $('#app'),
		
		statsTemplate: _.template($('#stats-template').html()),
		
		totalClicks: 0,
		
		events: {
			'click #loginname': 'promptName',
			'click #startgame': 'startGame',
			'change #numsets': 'startGame',
			'change #cardsperset': 'startGame',
			'keydown #controls': 'checkKeyDown'
		},
		
		initialize: function() {
			this.displayName();
			this.$('#startgame').focus();
			Cards.bind('change:selected', _.bind(this.checkMatch, this));
			Cards.bind('change:selected', _.bind(this.updateClick, this));
			Cards.bind('add', _.bind(this.addCard, this));
		},
		
		render: function() {
			this.$('#stats').html(this.statsTemplate({
				total: Cards.length,
				matched: Cards.matched().length,
				remaining: Cards.remaining().length
			}));
			this.renderClicks();
		},
		
		renderClicks: function() {
			this.$('#totalclicks').text('Total clicks: ' + this.totalClicks);
		},

		updateClick: function() {
			this.totalClicks++;
			this.renderClicks();
		},
		
		promptName: function() {
			ls.setItem('loginname', 
				(prompt("What is your name?") || '').trim() || ls.getItem('loginname')
			);
			this.displayName();	
		},
		
		displayName: function() {
			$('#loginname').text(
				ls.getItem('loginname') || '{Click to Enter Name}'
			);
		},
		
		startGame: function() {
			this.$('#space').empty();
			this.totalClicks = 0;
			Cards.reset();

			var numsets = (parseInt($('#numsets').val()) || 5);
			$('#numsets').val(numsets);
			var cardsperset = (parseInt($('#cardsperset').val()) || 2);
			$('#cardsperset').val(cardsperset);
			var availcards = _.map(_.range(numsets*cardsperset), function(n) { return n -= n%cardsperset });
			for (i=0; i < numsets*cardsperset; i++) {
				var cardvalue = availcards.splice(
					Math.floor( Math.random()*availcards.length ),	1
				);
				Cards.add({value: cardvalue[0]});
			}
			this.render();
		},
		
		addCard: function(card) {
			var view = new CardView({model: card});
			$('#space').append(view.render().el);
		},
		
		checkMatch: function() {
			if (_.bind(Cards.hasMatch, Cards)()) this.render();
			if (Cards.remaining().length == 0) setTimeout(_.bind(this.promptNewGame, this), 1);
		},
		
		promptNewGame: function() {
		 	if ( confirm('Congratulations ' + ls.getItem('loginname') + '!\nYou solved it in ' + this.totalClicks + ' clicks.\n\n'+ 'Continue to new game?') ) {
				this.startGame();
		 	}
		},
		
		checkKeyDown: function(e) {
			if (e.which == 13) { this.startGame(); }
		}
	});
	
	window.Cards = new CardList;		
	window.appview = new AppView;
});