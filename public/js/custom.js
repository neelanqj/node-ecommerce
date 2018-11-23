$(function(){
  Stripe.setPublishableKey('pk_test_4XPTlZdjuGkinD5caBioClTD');

  $("#search").keyup(function(){
    var search_term = $(this).val();
    $.ajax({
      method: 'POST',
      url: '/api/search',
      data: {
        search_term
      },
      dataType: 'json',
      success: function(json){
        var data = json.hits.hits.map(function(hit){
          return hit;
        });
        $('#searchResults').empty();
        var html="";
        for(let i=0; i < data.length; i++){
          html+='<div class="col-md-4">';
          html+='<a href="/product/'+  data[i]._id  +'">';
          html+='<div class="thumbnail">';
          html+='<img src="'+  data[i]._source.image  +'">';
          html+='<div class="caption">';
          html+='<h3>'+  data[i]._source.name  +'</h3>';
          html+='<p>'+  data[i]._source.price  +'</p>';
          html+='</div></div></a></div>';
        }
        $('#searchResults').append(html);
      },
      error: function(error){
        console.log(error)
      }
    });
  });

$('form.require-validation').bind('submit', function(e) {
    var $form         = $(e.target).closest('form'),
    inputSelector = ['input[type=email]', 'input[type=password]',
    'input[type=text]', 'input[type=file]',
    'textarea'].join(', '),
    $inputs       = $form.find('.required').find(inputSelector),
    $errorMessage = $form.find('div.error'),
    valid         = true;

    $errorMessage.addClass('hide');
    $('.has-error').removeClass('has-error');
    $inputs.each(function(i, el) {
      var $input = $(el);
      if ($input.val() === '') {
        $input.parent().addClass('has-error');
        $errorMessage.removeClass('hide');
        $("#pay").prop('disabled', false);
        e.preventDefault(); // cancel on first error
      }
    });
  });

  $("#payment-form").on('submit', function(e) {
    var $form = $("#payment-form");
    $("#pay").prop('disabled', true);
    if (!$form.data('cc-on-file')) {
      e.preventDefault();
      Stripe.createToken({
        number: $('.card-number').val(),
        cvc: $('.card-cvc').val(),
        exp_month: $('.card-expiry-month').val(),
        exp_year: $('.card-expiry-year').val()
      }, stripeResponseHandler);
    }
  });

  function stripeResponseHandler(status, response) {
    var $form = $("#payment-form");
    if (response.error) {
      $('.error')
      .removeClass('hide')
      .find('.alert')
      .text(response.error.message);

      $("#pay").prop('disabled', false);
    } else {
      // token contains id, last4, and card type
      var token = response['id'];
      // insert the token into the form so it gets submitted to the server
      $form.find('input[type=text]').empty();
      $form.append("<input type='hidden' name='stripeToken' value='" + token + "'></input>");
      $form.get(0).submit();
    }
  }
});

$(document).on('click', "#plus", function(e){
  e.preventDefault();
  var priceValue = parseFloat($("#priceValue").val());
  var quantity = parseInt($("#quantity").val());

  priceValue += parseFloat($('#priceHidden').val());
  quantity += 1;
  $('#quantity').val(quantity);
  $('#priceValue').val(priceValue.toFixed(2));
  $('#total').html(quantity);
});

$(document).on('click', "#minus", function(e){
  e.preventDefault();
  var priceValue =  parseFloat($("#priceValue").val());
  var quantity = parseInt($("#quantity").val());

  priceValue -= parseFloat($('#priceHidden').val());
  quantity -= 1;
  if(priceValue <=0) priceValue = parseFloat($('#priceHidden').val());
  if(quantity <=0) quantity = 1;
  $('#quantity').val(quantity);
  $('#priceValue').val(priceValue.toFixed(2));
  $('#total').html(quantity);
});
