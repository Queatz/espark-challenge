
// Config

var videoId = 'ZHAqT4hXnMw';

var abTest = chooseRandomABTest();

var abTests = {
	0: 'Give the student control over video playback',
	1: 'Prevent the student from controlling video playback',
	2: 'Prevent the student from controlling video playback, and play the video 1.5x as fast'
};

// Questions

var questions = [
	{
		text: 'What is the center of our Solar System?',
		choices: [
			'The Sun',
			'Saturn',
			'Earth'
		],
		correctChoice: 0
	},
	{
		text: 'How many moons does Mars have?',
		choices: [
			'None',
			'Two',
			'Thousands'
		],
		correctChoice: 1
	},
	{
		text: 'How many planets are in our Solar System?',
		choices: [
			'Twelve',
			'Eight',
			'Thousands'
		],
		correctChoice: 1
	}
];

// Screens

var screens = {
	begin: {
		elementId: 'screen-begin'
	},
	prepareQuestions: {
		elementId: 'screen-prepare-questions'
	
	},
	question: {
		elementId: 'screen-question',
		init: function (player) {
			player.startQuiz();
		}
	},
	done: {
		elementId: 'screen-done',
		init: function (player) {
			var results = player.data.correctAnswers + '/' + player.data.totalQuestions;
			
			document.querySelector('#results').innerHTML = results;
			
			player.dumpLogs();
		}
	} 
};

// Application

function Player() {
	var self = this;
	
	this.youtubePlayer = null;
	this.overlay = null;
	
	this.data = {
		correctAnswers: 0,
		totalQuestions: 3,
		currentQuestionIndex: 0,
		currentChoiceIndex: null,
		currentScreen: null,
		startQuizTime: null,
		studentLog: [],
	};
	
	this.track = function (event) {
		var logEntry = {
			date: new Date(),
			event: event,
			videoPlaybackTime: self.youtubePlayer.getCurrentTime()
		};

		self.data.studentLog.push(logEntry);
	};
	
	this.onStateChange = function (event) {
		switch (event.data) {
			case YT.PlayerState.ENDED:
				self.track('Video ended');
				self.showScreen('prepareQuestions');
				break;
			case YT.PlayerState.PAUSED:
				self.track('Video paused');
				break;
			case YT.PlayerState.PLAYING:
				self.track('Video is playing');
				break;
			case YT.PlayerState.BUFFERING:
				self.track('Video is buffering (paused)');
				break;
		}
	};
	
	this.showScreen = function (screen) {
		if (self.youtubePlayer) {
			if (screen) {
				self.youtubePlayer.pauseVideo();
				self.track('Show screen "' + screen + '"');
			} else {
				if (self.data.currentScreen) {
					var screenElement = document.querySelector('#' + self.data.currentScreen.elementId);
					screenElement.style.display = 'none';
					self.data.currentScreen = null;
				}
			
				self.youtubePlayer.playVideo();
				
				return;
			}
		}
		
		var screenData = screens[screen];
		self.data.currentScreen = screenData;
		
		var screenElement = document.querySelector('#' + screenData.elementId);
		
		screenElement.style.display = 'flex';
		
		if (screenData.init) {
			screenData.init(self);
		}
	};
	
	this.startQuiz = function () {
		self.data.startQuizTime = new Date();
		self.drawCurrentQuestion();
	}
	
	this.choose = function (event, choice) {
		self.clearChoiceSelection();
		
		self.data.currentChoiceIndex = choice;
		
		var currentQuestion = questions[self.data.currentQuestionIndex];
		self.track('Student selected choice: "' + currentQuestion.choices[choice] + '"');
		
		event.target.className = 'btn choice selected';
		document.querySelector('#next-question').disabled = '';
	};
	
	this.nextQuestion = function () {
		// Record final choice
		var currentQuestion = questions[self.data.currentQuestionIndex];
		if (self.data.currentChoiceIndex === currentQuestion.correctChoice) {
			self.data.correctAnswers++;
		}
		
		self.clearChoiceSelection();
		self.data.currentQuestionIndex++;
		self.data.currentChoiceIndex = null;
		
		document.querySelector('#next-question').disabled = 'disabled';
		
		if (self.data.currentQuestionIndex >= self.data.totalQuestions) {
			self.showScreen('done');
		} else {
			self.drawCurrentQuestion();
		}
	};
	
	this.clearChoiceSelection = function () {
		var choiceElements = document.querySelectorAll('.choice');
	
		for (var i = 0; i < choiceElements.length; i++) {
			choiceElements[i].className = 'btn choice';
		}
	};
	
	this.drawCurrentQuestion = function () {
		var questionIdElement = document.querySelector('#current-question-id');
		var questionTextElement = document.querySelector('#current-question-text');
		
		var questionChoiceElements = [
			document.querySelector('#current-question-choice-0'),
			document.querySelector('#current-question-choice-1'),
			document.querySelector('#current-question-choice-2')
		];
		
		var currentQuestion = questions[self.data.currentQuestionIndex];
		
		questionTextElement.innerText = currentQuestion.text;
		
		for (var i = 0; i < 3; i++) {
			questionChoiceElements[i].innerText = currentQuestion.choices[i];
		}
		
		var currentQuestion = questions[self.data.currentQuestionIndex];
		self.track('Showing question: "' + currentQuestion.text + '"');
		
		questionIdElement.innerHTML = self.data.currentQuestionIndex + 1;
	};
	
	this.dumpLogs = function () {
		
		console.log('\nStudent Report:\n\n');
		
		var seconds = new Date().getTime() - self.data.startQuizTime.getTime();
		seconds /= 1000;
		seconds = Math.round(seconds);
		
		console.log('Student got ' + self.data.correctAnswers + ' answers out of ' + self.data.totalQuestions + ' correct');
		console.log('Student took ' + seconds + ' seconds to complete the quiz');
		console.log('Student was assessed under the following variation: "' + abTests[abTest] + '"');
		
		console.log('\nStudent Log:\n\n');
	
		for (var i = 0; i < self.data.studentLog.length; i++) {
			var entry = self.data.studentLog[i];
			
			console.log(
				'event: ' + entry.event + '\n' + 
				'date: ' + entry.date + '\n' + 
				'playback time: ' + Math.floor(entry.videoPlaybackTime) + ' seconds\n'
			);
		}
	};
	
	this.initialize = function (player) {
		self.youtubePlayer = player;
		self.overlay = document.querySelector('#overlay');
		
		var abTestElement = document.querySelector('#ab-test');
		abTestElement.innerHTML = 'A/B Test #' + (abTest + 1) +
			'<br />' + 
			abTests[abTest];
	};
	
	this.ready = function () {
		self.showScreen('begin');
		self.youtubePlayer.setPlaybackRate(getABTestValue('playback rate'));
	};
}

// AB Testing

function chooseRandomABTest() {
	return Math.floor(Math.random() * 3);
}

function getABTestValue(variable) {
	switch (variable) {
		case 'controls':
			if (abTest === 1 || abTest === 2) {
				return 0;
			} else {
				return 1;
			}
		case 'playback rate':
			if (abTest === 2) {
				return 1.5;
			} else {
				return 1;
			}
		default:
			throw new Error('Unknown AB test variable: ' + variable);
	}
}

// Initialize

var player = new Player();

function onYouTubeIframeAPIReady() {
    player.initialize(new YT.Player('video-placeholder', {
        width: 854,
        height: 480,
        videoId: videoId,
        playerVars: {
            color: 'white',
            showinfo: 0,
            controls: getABTestValue('controls'),
            end: 104,
            start: 4,
            modestbranding: 1
        },
        events: {
        	onReady: player.ready,
            onStateChange: player.onStateChange
        }
    }));
}
