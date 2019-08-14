var app = angular.module('myApp', []);

app.controller('userCtrl', function($scope, TwitterGetUserService){
	$scope.getUser = function(username){
		TwitterGetUserService.getUser(username)
		    .then(function(data){
		        $scope.twitterErrors = undefined;
	        	$scope.results = JSON.parse(data.result.userData);
		    })
		    .catch(function(error){
		        console.error('there was an error retrieving data: ', error);
		        $scope.twitterErrors = error.error;
		    })
	}
});

app.controller('tweetCtrl', function($scope, TwitterGetTweetsService){
	$scope.refreshTime=null;
	$scope.tweets=[];
	$scope.handlesWatch=[];
	$scope.readTweetsID=[];
	$scope.addHandleToWatch = function(username){
		$scope.handlesWatch.push(username);
		//window.localStorage.setItem('handles',$scope.handlesWatch);
		$scope.pullnewTweets(username);
	}
	$scope.startCountDown = function(){
		setInterval(function(){$scope.refreshTime-=1;}, 1000);
	}
	$scope.startPolling = function(){
		setInterval(function(){ $scope.pullallTweets() }, 30000);
	}
	$scope.pullallTweets = function(){
		$scope.handlesWatch.forEach(handle => {
			// console.log('Polling : '+handle);
			$scope.pullnewTweets(handle);
		});
	}
	$scope.pullnewTweets = function(handle){
		TwitterGetTweetsService.getTweets(handle)
		.then(function(data){
			$scope.twitterErrors = undefined;
			var newTweets = JSON.parse(data.result.tweetData);
			if ($scope.readTweetsID.length===0){
				newTweets.forEach(el=>{
					$scope.tweets.push(el);
				});
			} else if ($scope.readTweetsID.length>=1){
				let sanitizedData=$scope.sanitizeData( newTweets );
				sanitizedData.forEach(el => {
					$scope.tweets.push(el);
				});
			}
		})
		.catch(function(error){
			console.error('there was an error retrieving data: ', error);
			$scope.twitterErrors = error.error;
		})
	}
	$scope.sanitizeData = function(data){
		//Filter for tweets that already exist in DOM
		for (let i = 0; i < data.length; i++) {
			const tweetID = data[i].id_str;
			$scope.tweets.forEach(el => {
				if (el.id_str===tweetID){
					data.splice(i,1);
					i-=1;
				}
			});
		}
		//Filter for unread tweets
		for (let i = 0; i < data.length; i++) {
			const tweetID = data[i].id_str;
			$scope.readTweetsID.forEach(el => {
				if (el===tweetID){
					data.splice(i,1);
					i-=1;
				}
			});
		}
		return data;
	}
	$scope.markRead = function(iD){
		let removedTweet=$scope.tweets.splice(iD,1);
		$scope.addtoLocalStorage(removedTweet);
	}
	$scope.addtoLocalStorage = function(tweet){
		$scope.readTweetsID.push(tweet[0].id_str);
		//window.localStorage.setItem('readTweets',$scope.readTweets);
	}
});

app.factory('TwitterGetUserService', function($http, $q){
  
  var getUser = function(username){
    var d = $q.defer();
    $http.post('/twitter/user', {username : username})
      .success(function(data){
        return d.resolve(data);
      })
      .error(function(error){
        return d.reject(error);
      });
    return d.promise;
  };

  return {
    getUser : getUser
  }
});

app.factory('TwitterGetTweetsService', function($http, $q){
  
  var getTweets = function(username){
    var d = $q.defer();
    $http.post('/twitter/gettweets', {username : username})
      .success(function(data){
        return d.resolve(data);
      })
      .error(function(error){
        return d.reject(error);
      });
    return d.promise;
  };

  return {
    getTweets : getTweets
  }
});

