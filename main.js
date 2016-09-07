var filmApp = {};

//object containing an array of the genre name and its corresponding id
var genres = [
    {
      id: 12,
      name: "Action",
      value: "action"
    },
    {
      id: 16,
      name: "Animation",
      value: "animated"
    },
    {
      id: 35,
      name: "Comedy",
      value: "comedy"
    },
    {
      id: 80,
      name: "Crime",
      value: "crime"
    },
    {
      id: 99,
      name: "Documentary",
      value: "documentary"
    },
    {
      id: 18,
      name: "Drama",
      value: "drama",
    },
    {
      id: 10751,
      name: "Family",
      value: "family"
    },
    {
      id: 14,
      name: "Fantasy",
      value: "fantasy"
    },
    {
      id: 36,
      name: "History",
      value: "historical"
    },
    {
      id: 27,
      name: "Horror",
      value: "horror"
    },
    {
      id: 10749,
      name: "Romance",
      value: "romance"
    },
    {
      id: 878,
      name: "ScienceFiction",
      value: "sci-fi"
    },
    {
      id: 53,
      name: "Thriller",
      value: "thriller"
    },
    {
      id: 10752,
      name: "War",
      value: "war"
    },
    {
      id: 10402,
      name: "Music",
      value: "music"
    }
];

filmApp.init = function(){
  $('.next').smoothScroll({
    speed: 400
  });
  $('div.display').hide();
  $('div.hide').hide();
  $('p.alert').hide();
  $('form').hide();
  $('div.displayResults').hide();
  filmApp.showForm();
  filmApp.getGenre();
  filmApp.getMoreResults();
  filmApp.getMoreInfo();
  filmApp.refreshPage();
}

//display form on intro button click
filmApp.showForm = function(){
  $('a.showForm').on('click', function(){
    $('form').show();
    $('div.displayResults').show();
    $('div.containForm').addClass('show');
    $('.first').smoothScroll({
      speed: 400,
      beforeScroll: function() {
        $('div.containForm').addClass('show');
      },
    });
  });
}

//reset value and results divs when user clicks input
filmApp.resetValue = function(){
  $('input[name=genre]').on('click', function(){
      $("#visible").show();
      $("#response").removeClass('visible');
      $('div.load-wrapp').show();
      $('div.display').hide();
      $('div.hide').hide();
  });
}

//a. listens to FORM for the user's genre choice and b. matches genreChoice to genre
filmApp.getGenre = function(){
  $("form").on("submit", function(e){
      e.preventDefault();
      console.log("submit");
      $('div.userResults').empty();
      $('div.moreResults').empty();
      $('div.movieText').empty();
      $('div.moviePoster').empty();
      if ($("input[name=genre]").is(":checked") === false) {
        // console.log("unchecked box!");
        $('p.alert').show();
      } else {
        $("#visible").hide();
        $("#response").addClass('visible');
        filmApp.genreChoice = $("input[name=genre]:checked").val();
        console.log("genre choice: ",filmApp.genreChoice);
        genres.forEach(function(genre){
          if (filmApp.genreChoice === genre.value){
            filmApp.id = genre.id;
            // console.log("id: ", filmApp.id)
            };
        });
        filmApp.getFemaleDirectors();
        filmApp.resetValue();
      }


    });
};

//call sheetsu API for women directors
filmApp.getFemaleDirectors = function(){
    $.ajax({
      url: "https://sheetsu.com/apis/v1.0/b7ca154be8b9",
      method: 'GET',
      dataType: 'json'
    }).then(function(res) {
      filmApp.results = res;
      filmApp.topNum = 20;
      filmApp.bottomNum = 0;
      filmApp.sortSheetsuResults();
    })
};

//save names and movie genres collected from Sheetsu API
filmApp.sortSheetsuResults = function(){
      filmApp.director = {};
      filmApp.directors = [];
      filmApp.results.forEach(function(director){
        if (director.GENRES.includes(filmApp.genreChoice)) {
              filmApp.director = {'name' : director.FIRST + " " + director.LAST, 'genre': filmApp.genreChoice, 'id': filmApp.id};
              filmApp.directors.push(filmApp.director);
        };
      });

      if (filmApp.directors.length > filmApp.topNum) {
        filmApp.directors = filmApp.directors.slice(filmApp.bottomNum,filmApp.topNum);
        var moreButton = $('<button>').addClass('more btn pulse-button-large ').attr('id', filmApp.id).text('More Results');
        $('div.moreResults').append(moreButton);
      } else {
        filmApp.directors = filmApp.directors.slice(filmApp.bottomNum,filmApp.directors.length);
        var moreButton = $('<button>').addClass('more btn pulse-button-large ').attr('id', filmApp.id).text('More Results');
      }

      // console.log("filmApp.directors: ", filmApp.directors);
      filmApp.getDirectorInfo();
};

//calls Movie Database API to get director's id
filmApp.getDirectorInfo = function(){
    var directorId = filmApp.directors.map(function(director){
        return $.ajax({
            url: 'http://api.themoviedb.org/3/search/person',
            method: 'GET',
            dataType: 'json',
            data:{
              api_key: '782a8200296cfbf8a75a88a9edc58aac',
              query: director.name
            }
        });
    })
    $.when.apply(null, directorId) 
      .then(function() {
          filmApp.directorNames = [];
          namesArray = [];
          namesArray = Array.prototype.slice.call(arguments);
          // console.log("names array: ", namesArray);
          
          //get director name, person id, notable films, and notable film ids:
          namesArray.forEach(function(director){
            var notableFilms = [];
             if (director[0].results.length > 0){
              //console.log("known for", director[0].results[0].known_for);
              director[0].results[0].known_for.forEach(function(film){
                //check that the notable films belong to selected genre
                film.genre_ids.forEach(function(genre){
                  if (genre === filmApp.id){
                    notableFilms.push(film);
                  }
                })
              });
            
              var names = {"personId": director[0].results[0].id, "director": director[0].results[0].name, "notableFilms" : notableFilms};
              filmApp.directorNames.push(names);
              }
            })
            filmApp.checkJob();
         },
         function(err){
          console.log("call failed");
         });
};

//for each notable film, checks if a. the person's job is director  AND b. the film belongs to selected genre
//for each film, gets credit info: makes ajax call using the film ids from filmApp.directorsNames
filmApp.checkJob = function(){
    filmApp.directorNames.forEach(function(director){
      var movies = director.notableFilms.map(function(film){
        return $.ajax({
            url: "http://api.themoviedb.org/3/movie/" + film.id + "/credits",
            method: 'GET',
            dataType: 'json',
            data:{
              api_key: "782a8200296cfbf8a75a88a9edc58aac"
            }
        });
      })
    $.when.apply(null, movies) 
        .then(function() {
            credits = [];
            credits = Array.prototype.slice.call(arguments);
            
            //find the director information within the returned results. 
            credits.forEach(function(film){
              //If results is array: for each result within credits, look at result[0] & key:crew: 
              if (Array.isArray(film) === true){
                film[0].crew.forEach(function(crewMember){
                  filmApp.directorNames.forEach(function(directorName){
                      if(crewMember.job === "Director" &&  crewMember.name === directorName.director ){
                          director.notableFilms.forEach(function(notableFilm){
                            if (notableFilm.id === film[0].id){
                              // console.log("name: ", crewMember.name, "notable film: ",  notableFilm.title, " film id: ", film[0].id, "description: ", notableFilm.overview );
                              filmApp.name = $('<p>').addClass('director').text("Director: " + crewMember.name);
                              filmApp.date = $('<p>').addClass('film').text('Release Date: ' + notableFilm.release_date);
                              filmApp.button = $('<a>').attr('href','#movieDetails').addClass('next learnMore btn ' + notableFilm.title).attr('id', notableFilm.id).text('Learn More');
                              filmApp.notableFilm = $('<h4>').addClass('film').text(notableFilm.title);
                              // var containResult = $('<div>').addClass('containResult wrapper');
                              // $('div.userResults').append(containResult);
                              $('input[name=genre]').attr('checked', false);
                              $('div.userResults').append(filmApp.notableFilm, filmApp.name, filmApp.date , filmApp.button);
                              
                              }; //close if (notableFilm.id === film[0].id)
                          })
                      }; //close if(crewMember.job === "Director" && crewMember.name === directorName.director )
                  }); //close filmApp.directorNames.forEach(function(directorName)
                }) //close film[0].crew.forEach(function(crewMember)
              } else if (typeof film === "object") { //if only on result is returned (ie !array) 
                  film.crew.forEach(function(crewMember){
                    filmApp.directorNames.forEach(function(directorName){
                        if(crewMember.job === "Director" &&  crewMember.name === directorName.director ){
                          director.notableFilms.forEach(function(notableFilm){
                            if (notableFilm.id === film.id){
                              // console.log("name: ", crewMember.name, "notable film: ",  notableFilm.title, " film id: ", film.id, "description: ", notableFilm.overview );
                              filmApp.name = $('<p>').addClass('director').text("Director: " + crewMember.name);
                              // var overview = $('<p>').addClass('overview').text(notableFilm.overview);
                              filmApp.date  = $('<p>').addClass('film').text('Release Date: ' + notableFilm.release_date);
                              filmApp.button = $('<a>').attr('href','#movieDetails').addClass('next learnMore btn ' + notableFilm.title).attr('id', notableFilm.id).text('Learn More');
                              filmApp.notableFilm = $('<h4>').addClass('film').text(notableFilm.title);
                              $('input[name=genre]').attr('checked', false);
                              $('div.userResults').append(filmApp.notableFilm, filmApp.name, filmApp.date, filmApp.button);
                              }; //close if (notableFilm.id === film.id)
                          })//close director.notableFilms.forEach(function(notableFilm)
                          // var containResult = $('<div>').addClass('containResult wrapper');
                          //     $('div.userResults').append(containResult);
                          //     $('div.containResult').append(filmApp.notableFilm, filmApp.name, filmApp.date, filmApp.button);
                        }; //close if(crewMember.job === "Director" && crewMember.name === directorName.director )
                    }); //close filmApp.directorNames.forEach(function(directorName)
                })//close film.crew.forEach(function(crewMember)
            };
            $('div.load-wrapp').hide();
            $('div.display').show();
            $('div.hide').show();
         })
         }, 
         function(err){
            console.log("checkJob call failed.");
         });
    })
};

//more movie titles
filmApp.getMoreResults = function(){
  $('div.moreResults').on('click', '.more' ,function(){
    console.log("worked!");
    $(".more").hide();
    filmApp.topNum = filmApp.topNum + 20;
    filmApp.bottomNum = filmApp.bottomNum + 20;
    filmApp.sortSheetsuResults();
  });
}


filmApp.getMoreInfo = function(){
  $('div.userResults').on('click', '.learnMore' ,function(){


    $(this).addClass('clicked');
    $('div.movieDetails').addClass('show');
    filmApp.getMovieDetails(this.id);
    //make call to get movie info
  });
}


filmApp.getMovieDetails = function(id){
  $.ajax({
      url: 'http://api.themoviedb.org/3/movie/' + id,
      method: 'GET',
      dataType: 'json',
      data:{
        api_key: '782a8200296cfbf8a75a88a9edc58aac',
      }
  }).then(function(res) {
      var title = $('<h3>').text(res.title).addClass('featureTitle');
      var overview = $('<p>').text("Overview: " + res.overview).addClass('featureOverview');
      var language = $('<p>').text('Original Language: ' + res.original_language).addClass('featureLanguage');
      var imdb = $('<a>').attr('href', 'http://www.imdb.com/title/' + res.imdb_id).text('Read more on IMDB ').addClass('accent featureRead');
      var externalIcon = $('<i>').toggleClass('fa fa-external-link').attr('aria-hidden', 'true');
      var poster = $('<img>').attr('src', 'http://image.tmdb.org/t/p/w500' + res.poster_path).addClass('featurePoster');
      var retry = $('<button>').addClass('btn retry').text('Start Over');

      if( $('div.movieText').is(':empty') &&  $('div.moviePoster').is(':empty')  ) {
        $('div.movieText').append(title, overview, language, imdb, retry);
        $('div.moviePoster').append(poster);
      } else {
        console.log("empty me!");
        $('div.movieText').empty();
        $('div.moviePoster').empty();
        $('div.movieText').append(title, overview, language, imdb, retry);
        $('div.moviePoster').append(poster);
      }
  });
}

filmApp.refreshPage = function(){
  $('div.movieDetails').on('click', 'button' ,function(){
      window.location.reload();
      $("body").scrollTop(0);
  });
}

//DOC READY
$(function(){
    filmApp.init();
});