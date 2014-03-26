var cssDinner = (function() {
  'use strict';

  var config = {
    level: 1,
    currentLevel : parseInt(localStorage.currentLevel,10) || 0,
    levelTimeout: 1000,
    fails: 0
  }

  var events = {
    '.note-toggle|click' : showNotes,
    '.level-menu-toggle-wrapper|click' : showMenuLevels,
    'input|keypress' : submitAnswer,
    'input|keyup' : blinkInput,
    '.table|mouseover|*' : showTableTooltip,
    '.table|mouseout|*' : hideTableTooltip,
    '.markup|mouseover|*' : showTooltipHoverCode,
    '.markup|mouseout|*' : hideTooltipHoverCode,
    '.enter-button|click' : submitOnClick,
  }

  function init () {
    _loadEvents();
    _waitTableContent();
  }

  function _loadEvents () {
    $.each(events, function (eventDesc,fn) {
      var selectorEvent = eventDesc.split('|')
      $(selectorEvent[0]).on(selectorEvent[1], selectorEvent[2], function(evt){
        var $this = $(this);
        fn(evt, $this);
      });
    });
  }

  function showNotes(evt){
    $(this).hide();
    $(".note").slideToggle();
  }

  function showMenuLevels (evt) {
    $(".level-menu").toggleClass("open");
  }

  function submitAnswer (evt) {
    //Handle inputs from the input box on enter
    evt.stopPropagation();
    if(evt.keyCode ==  13){
      enterHit();
      return false;
    }
  }

  function blinkInput (evt) {
    evt.stopPropagation();
    var length = $(this).val().length;
    if(length > 0) {
      $("input").removeClass("input-strobe");
    } else {
      $("input").addClass("input-strobe");
    }
  }

  function focusInput (evt) {
    $("input").focus();
  }

  function showTableTooltip (evt, $this) {
    evt.stopPropagation();
    showTooltip($this);
  }

  function hideTableTooltip (evt, $this) {
    hideTooltip();
    evt.stopPropagation();
  }

  function showTooltipHoverCode (evt, $this) {
    var markupElements = $(".markup *");
    var index = markupElements.index(this) -1;
    showTooltip($(".table *").eq(index));
    evt.stopPropagation();
  }

  function hideTooltipHoverCode (evt, $this) {
    evt.stopPropagation();
    hideTooltip();
  }

  function submitOnClick (evt, $this) {
    enterHit();
  }

  function _waitTableContent (argument) {
    var $tableContainer = $(".table-wrapper,.table-edge");
    $tableContainer.css("opacity",0);
    setTimeout(function(){
      loadLevel();
      $tableContainer.css("opacity",1);
    },50);
    _buildLevelmenu();
  }

  function _buildLevelmenu(){
    for(var i = 0; i < levels.length; i++){
      var level = levels[i];
      var item = document.createElement("a");
      $(item).html(level.syntax);
      $(".level-menu .levels").append(item);
      $(item).on("click",function(){
        config.currentLevel = $(this).index();
        loadLevel();
      });
    }
  }

  function hideTooltip(){
    $(".enhance").removeClass("enhance");
    $("[data-hovered]").removeAttr("data-hovered");
    $(".helper").hide();
  }

  function showTooltip(el){
    el.attr("data-hovered",true);
    var tableElements = $(".table *");
    var index = tableElements.index(el);
    var that = el;
    $(".markup > div *").eq(index).addClass("enhance").find("*").addClass("enhance");

    var helper = $(".helper");

    var pos = el.offset();
    helper.css("top",pos.top - 65);
    helper.css("left",pos.left + (el.width()/2));

    var helpertext;

    var elType = el.get(0).tagName;
    elType = elType.toLowerCase();
    helpertext = '<' + elType;

    var elClass = el.attr("class");

    if(elClass) {
      if(elClass.indexOf("strobe") > -1){
        elClass = elClass.replace("strobe","");
      }
    }

    if(elClass) {
      helpertext = helpertext + ' class="' + elClass + '"';
    }

    var id = el.attr("id");
    if(id) {
      helpertext = helpertext + ' id="' + id + '"';
    }

    helpertext = helpertext + '></' + elType + '>';
    helper.show();
    helper.text(helpertext);

  }

  //Animate the enter button
  function enterHit(){
    $(".enter-button").removeClass("enterhit");
    $(".enter-button").width($(".enter-button").width());
    $(".enter-button").addClass("enterhit");
    var value = $("input").val();
    handleInput(value);
  }

  //Parses text from the input field
  function handleInput(text){
    if(text == ""){
      text = "blammojammo";
    }
    if(parseInt(text,10) > 0 && parseInt(text,10) < levels.length+1) {
      config.currentLevel = parseInt(text,10) - 1;
      loadLevel();
      return;
    }
    if(text == "help") {
      showHelp();
    } else {
      fireRule(text);
    }
  }

  //Shows help
  function showHelp() {

    $("input").val("");
    var helpTitle = config.level.helpTitle || "";
    var help = config.level.help || "";
    var examples = config.level.examples ||[];
    var selector = config.level.selector || "";
    var syntax = config.level.syntax || "";
    var syntaxExample = config.level.syntaxExample || "";
    var selectorName = config.level.selectorName || "";

    $(".display-help .syntax").html(syntax);
    $(".display-help .syntax-example").html(syntaxExample);
    $(".display-help .selector-name").html(selectorName);
    $(".display-help .title").html(helpTitle);
    $(".display-help .examples").html("");

    for(var i = 0; i < examples.length; i++){
      var example = $("<div class='example'>" + examples[i] + "</div>");
      $(".display-help .examples").append(example);
    }
    $(".display-help .hint").html(help);
    $(".display-help .selector").text(selector);
  }

  function resetTable(){
    $(".display-help").removeClass("open-help");
    $(".clean,.strobe").removeClass("clean,strobe");
    $(".clean,.strobe").removeClass("clean,strobe");
    $("input").addClass("input-strobe");
    $(".table *").each(function(){
      $(this).width($(this).width());
      $(this).removeAttr("style");
    });
    $(".table-edge").width($(".table").outerWidth());
  }

  function fireRule(rule) {

    // prevent cheating
    if(rule === ".strobe") {
      rule = null;
    }

    $(".shake").removeClass("shake");

    $(".strobe,.clean,.shake").each(function(){
      $(this).width($(this).width());
      $(this).removeAttr("style");
    });

    /*
    * Sean Nessworthy <sean@nessworthy.me>
    * On 03/17/14
    *
    * Allow [div][.table] to preceed the answer.
    * Makes sense if div.table is going to be included in the HTML viewer
    * and users want to try and use it in their selectors.
    *
    * However, if it is included as a specific match, filter it out.
    * This resolves the  "Match all the things!" level from beheading the table too.
    * Relatedly, watching that happen made me nearly spill my drink.
    */

    var baseTable = $('.table-wrapper > .table');

    // var ruleSelected = $(".table-wrapper " + rule).not(baseTable);
    // var levelSelected = $(".table-wrapper " + level.selector).not(baseTable);

    var ruleSelected = $(".table-wrapper").find(rule).not(baseTable);
    var levelSelected = $(".table-wrapper").find(config.level.selector).not(baseTable);


    var win = false;

    //If nothing is selected
    if(ruleSelected.length == 0) {
      $(".editor").addClass("shake");
    }

    if(ruleSelected.length == levelSelected.length && ruleSelected.length > 0){
      win = checkResults(ruleSelected,levelSelected,rule);
    }

    if(win){
      ruleSelected.removeClass("strobe");
      ruleSelected.addClass("clean");
      // $(".result").text("Good job!");
      $("input").val("");
      $(".input-wrapper").css("opacity",.2);
      config.currentLevel++;
      if(config.currentLevel >= levels.length) {
        winGame();
      } else {
        setTimeout(function(){
          loadLevel();
        },config.levelTimeout);
      }

    } else {

      continueRule();

      ruleSelected.removeClass("strobe");
      ruleSelected.addClass("shake");

      setTimeout(function(){
        $(".shake").removeClass("shake");
        $(".strobe").removeClass("strobe");
        levelSelected.addClass("strobe");
      },500);

      $(".result").fadeOut();
    }

  }

  function winGame(){
    $(".table").html('<span class="winner"><strong>You did it!</strong><br>You are a CSS God.</span>');
    resetTable();
  }

  function checkResults(ruleSelected,levelSelected,rule){
    var ruleTable = $(".table").clone();
    ruleTable.find(".strobe").removeClass("strobe");
    ruleTable.find(rule).addClass("strobe");
    return($(".table").html() == ruleTable.html());
  }

  var d = 2;
  function continueRule() {
    console.log("Fails thus far: " + ++config.fails)
  }


  function loadBoard(){

    var boardString = config.level.board;
    var boardMarkup = "";
    var tableMarkup = "";
    var markup = "";
    showHelp();

    for(var i = 0;i < boardString.length;i++){

      var c = boardString.charAt(i);

      if(c == "C") {
        boardMarkup = boardMarkup + '<carrot/>\n'
        markup = markup + "<div>&ltcarrot/&gt</div>";
      }
      if(c == "A") {
        boardMarkup = boardMarkup + '<apple/>\n'
        markup = markup + "<div>&ltapple/&gt</div>";
      }
      if(c == "O") {
        boardMarkup = boardMarkup + '<orange/>\n'
        markup = markup + "<div>&ltorange/&gt</div>";
      }
      if(c == "P") {
        boardMarkup = boardMarkup + '<pickle/>\n'
        markup = markup + '<div>&ltpickle/&gt</div>';
      }
      if(c == "a") {
        boardMarkup = boardMarkup + '<apple class="small"/>\n'
        markup = markup + '<div>&ltapple class="small"/&gt</div>';
      }
      if(c == "o") {
        boardMarkup = boardMarkup + '<orange class="small"/>\n'
        markup = markup + '<div>&ltorange class="small"/&gt</div>';
      }
      if(c == "p") {
        boardMarkup = boardMarkup + '<pickle class="small"/>\n'
        markup = markup + '<div>&ltpickle class="small"/&gt</div>';
      }
      if(c == "{") {
        boardMarkup = boardMarkup + '<plate id="fancy">'
        markup = markup + '<div>&ltplate id="fancy"/&gt';
      }
      if(c == "(") {
        boardMarkup = boardMarkup + '<plate>'
        markup = markup + '<div>&ltplate&gt'
      }
      if(c == ")" || c == "}") {
        boardMarkup = boardMarkup + '</plate>\n'
        markup = markup + '&lt/plate&gt</div>'
      }
      if(c == "[") {
        boardMarkup = boardMarkup + '<bento>'
        markup = markup + '<div>&ltbento&gt'
      }
      if(c == "]") {
        boardMarkup = boardMarkup + '</bento>\n'
        markup = markup + '&lt/bento&gt</div>'
      }

    }
    $(".table").html(boardMarkup);
    $(".markup").html('<div>&ltdiv class="table"&gt' + markup + '&lt/div&gt</div>');
  }

  //Loads up a level
  function loadLevel(){
    config.level = levels[config.currentLevel];

    // Show the help link only for the first three levels
    if(config.currentLevel < 3) {
      $(".note-toggle").show();
    } else {
      $(".note-toggle").hide();
    }

    $(".level-menu .current").removeClass("current");
    $(".level-menu div a").eq(config.currentLevel).addClass("current");

    var percent = (config.currentLevel+1)/levels.length * 100;
    $(".progress").css("width",percent + "%");

    localStorage.setItem("currentLevel",config.currentLevel);

    loadBoard();
    resetTable();

    $(".level-header").html("Level " + (config.currentLevel+1) + " of " + levels.length);
    $(".order").text(config.level.doThis);
    $("input").val("").focus();


    $(".input-wrapper").css("opacity",1);
    $(".result").text("");

    //Strobe what's supposed to be selected
    $(".table " + config.level.selector).addClass("strobe");

  }

  return {
    init:init
  };

}());


$(document).ready(function(){

  cssDinner.init()

});









