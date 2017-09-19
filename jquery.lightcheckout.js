/*
 * LightCheckout  v1.1
 *
 * Copyright 2015, Claudio Sperti, http://www.lightcheckout.com
 * 
 */
 ;(function($){

    var plugin = {},
		defaults = {
			inputWrapper : 'div',
			autocomplete: null,
			address: '.address',
			city: '.city',
			province: '.province',
			zip: '.zip',
			country: '.country',
			shortProvince: true,
			noNumberError: 'Please, insert also street number.',
			language: 'en',
			setField: function ($input, value) {
				$input.val(value);
			},
            onComplete: function(settings, values, isDirty) {}
		},
		
		oldId,
		newInputId,
		triggeredLc = true,
		types = { types: ['address'] };
		
		
	// open function for document trigger	
	$.fn.loadedGp = function() {
	    if( triggeredLc ) {
	        triggeredLc = false;
			if( plugin.form.length > 0) {
				plugin.form.trigger("initGp");
			}
	    }
	}

    $.fn.lightCheckout = function(options) {

        if( this.length === 0 ) return this;

        // support mutltiple elements
        if( this.length > 1 ) {
            console.error("lightCheckout: you have to initialize 1 form at time.");
            return this;
        }
        
        plugin.form = $(this);


        var init = function(){

            plugin.settings = $.extend({}, defaults, options);

            var autoNewId,
            	autocomplete,
                input;
			
            plugin.settings.inputs = {
                address: plugin.form.find(plugin.settings.address),
                city: plugin.form.find(plugin.settings.city),
                province: plugin.form.find(plugin.settings.province),
                zip: plugin.form.find(plugin.settings.zip),
                country: plugin.form.find(plugin.settings.country)
            };
            
            if(
                plugin.settings.inputs.address.length !== 1 ||
                plugin.settings.inputs.city.length !== 1 ||
                plugin.settings.inputs.province.length !== 1 ||
                plugin.settings.inputs.zip.length !== 1 ||
                plugin.settings.inputs.country.length !== 1
                ) {
				console.error("lightCheckout: form input missed.");
				return;
				
			}
			
            plugin.settings.wrappers = {
                address: plugin.settings.inputs.address.closest(plugin.settings.inputWrapper),
                city: plugin.settings.inputs.city.closest(plugin.settings.inputWrapper),
                province: plugin.settings.inputs.province.closest(plugin.settings.inputWrapper),
                zip: plugin.settings.inputs.zip.closest(plugin.settings.inputWrapper),
                country: plugin.settings.inputs.country.closest(plugin.settings.inputWrapper)
            };
				
            if( typeof $.getScript !== "function" ) {
				console.error("lightCheckout: getScript function missed.");
				return;
            }
			
            if( plugin.settings.autocomplete === null ) {
               cloneAutocompleteInput(); 
            } else {
                getAutocompleteInputInForm();
            }
            
            //hideInputs();

            if( typeof google === "undefined" || typeof google.maps === "undefined" || typeof google.maps.places === "undefined" ) {
            	$.getScript('https://maps.googleapis.com/maps/api/js?libraries=places&language=' + plugin.settings.language + '&callback=$.fn.loadedGp' );
				plugin.form.one("initGp", setup );
            } else {
            	setup();
            }
        }
		
		var getAutocompleteInputInForm = function() {
		
			plugin.clonedInput = plugin.form.find(plugin.settings.autocompleteInput);
            newInputId = plugin.clonedInput.find('input').attr('id');
		
		}
		
		var triggerInvalid = function() {
			plugin.settings.valid = false;
		}
		
		var triggerValid = function() {
			plugin.settings.valid = true;
		}
		
		
		
		var cloneAutocompleteInput = function(){
		
			plugin.clonedInput = plugin.settings.wrappers.address.clone().addClass('lcWrapper').removeClass('hidden');

			oldId = plugin.settings.inputs.address.attr('id');
				
			plugin.clonedInput.find('input')
							.attr('id', oldId + "_lcInput")
							.attr('autocomplete', "off")
							.removeAttr('required')
							.attr("type", "text")
							.val("")
							.removeAttr('name')
							.on('keypress', triggerInvalid);
							
			var theAddress = "";
			
			$.each(plugin.settings.wrappers, function(index, field) {
				if(field.find('input').val() != "") {
					triggerValid();
					theAddress += field.find('input').val() + ", ";
				}
			});
			
			theAddress = theAddress.slice(0,-2);
			
			plugin.clonedInput.find('input').val(theAddress).attr("placeholder", theAddress);

			plugin.settings.wrappers.address.before( plugin.clonedInput.attr('id', oldId + "_lcWrapper" ) );
			
			newInptId = oldId + "_lcInput";
			
		}

        var hideInputs = function() {
            plugin.settings.wrappers.address.addClass('lc-input lc-hide hidden');
            plugin.settings.wrappers.city.addClass('lc-input lc-hide hidden');
            plugin.settings.wrappers.zip.addClass('lc-input lc-hide hidden');
            plugin.settings.wrappers.province.addClass('lc-input lc-hide hidden');
            plugin.settings.wrappers.country.addClass('lc-input lc-hide hidden');
        }
        
        var showInputs = function() {
            plugin.settings.wrappers.address.removeClass('lc-hide hidden');
            plugin.settings.wrappers.city.removeClass('lc-hide hidden');
            plugin.settings.wrappers.zip.removeClass('lc-hide hidden');
            plugin.settings.wrappers.province.removeClass('lc-hide hidden');
            plugin.settings.wrappers.country.removeClass('lc-hide hidden');
            plugin.clonedInput.find('input').addClass('lc-input lc-hide hidden');
            plugin.clonedInput.addClass('hidden');
        }
		
		var setup = function() {
				
				if(typeof newInptId === "undefined" || typeof types === "undefined" ) return;
				
            	var input = document.getElementById(newInptId);

            	// Create the autocomplete object, restricting the search
	            // to geographical location types.
	            autocomplete = new google.maps.places.Autocomplete(
	                input,
	                types
	            );

	            // When the user selects an address from the dropdown,
	            // populate the address fields in the form.
	            google.maps.event.addListener(autocomplete, 'place_changed', placeChanged);

        }
		
		var placeChanged = function() {
            
            var place = autocomplete.getPlace(),
                sNumber = "",
                address = "",
                city = "",
                zip = "",
                province = "",
                level_1 = "",
                country = "";
				
			if (typeof place !== "undefined" && typeof place.address_components !== "undefined"){
			
				for(var i =0; i < place.address_components.length; i++) {

					var object = place.address_components[i],
						type = object.types[0];
					
					console.log(object);
					if( type == "street_number" ) sNumber = object.long_name;
					if( type == "route" ) address = object.long_name;
					if( type == "locality" ) city = object.long_name;
					//if( type == "administrative_area_level_3" ) city3 = object.long_name;
					if( type == "administrative_area_level_2" ) province = object;
					if( type == "postal_code" ) zip = object.long_name;
					if( type == "administrative_area_level_1" ) province = object;
					if( type == "country" ) country = object.long_name;
				}
				
				/* US exception */
				//province = (country== "United States") ? level_1 : province;
				
				
				/* long name or short name for province? */
				province = plugin.settings.shortProvince ? province.short_name : province.long_name;
				/* check error for address without street number */
				if ( sNumber === '') {
					plugin.settings.inputs.address.after('<span class="error noNumError">' + plugin.settings.noNumberError + '</span>');
					plugin.settings.inputs.address.one('focus', function() {
						$(this).siblings('.noNumError').remove();
					});
				}
				
				/* fill inputs */
				plugin.settings.setField(plugin.settings.inputs.address, sNumber + ' ' + address);
				plugin.settings.setField(plugin.settings.inputs.city, city);
				plugin.settings.setField(plugin.settings.inputs.zip, zip);
				plugin.settings.setField(plugin.settings.inputs.province, province);
				plugin.settings.setField(plugin.settings.inputs.country, country);
                
                //Trigger callback
                var values = [];
                values.push("sNumber", sNumber);
                values.push("address", address);
                values.push("city", city);
                values.push("province", province);
                values.push("country", country);
                
                triggerValid();
                
				plugin.settings.onComplete(plugin.settings, values, plugin.settings.valid);
				/* show filled inputs */
				//showInputs();
			} else {
				/* fallback no address found */
				showInputs();
			}
        }

        init();
        return {
		    isValid : function() {
				return plugin.settings.valid;
			}
        }
    }
})(jQuery);
