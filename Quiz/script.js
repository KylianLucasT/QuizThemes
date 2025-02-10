const main = document.getElementById('main');

// Thèmes et sous-thèmes
const themes = 
{
    // Histoire
        // XIXéme
    "Premier Empire"           : ["Napoléon Ier", "Soldats Napoléoniens"],
        // XXéme
    "Première Guerre Mondiale" : ["Verdun", "Géopolitique"],
    "Seconde Guerre Mondiale"  : ["Pearl Harbor", "Débarquement de Normandie", "Bataille De Midway", "Géopolitique"],

    // Transports
        //Bateaux
    "Paquebots"                : ["Classe Olympic"],

    // Sport
        // Course
    "Formule 1"                : ["Champions du Monde"]
};

let questions  = [];
let idQuestion = 0;
let score      = 0;
let isQCM      = true;


function normaliserString(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
}

function normaliserReponse(str) {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
}


function pageAccueil() {
    main.innerHTML = 
        `<div class="quiz-type-selecteur">
            <h2>Choisissez le type de quiz :</h2>
            <div class="toggle-container">
                <span>QCM</span>
                <label class="switch">
                    <input type="checkbox" id="quizTypeToggle">
                    <span class="slider round"></span>
                </label>
                <span>Texte</span>
            </div>
        </div>
        <div id="themes"></div>`;

    const themesContainer = document.getElementById('themes');
    
    const sortedThemes = Object.entries(themes).sort((a, b) => a[0].localeCompare(b[0]));

    for (const [theme, sousThemes] of sortedThemes) {
        const sectionTheme = document.createElement('section');
        sectionTheme.classList.add('theme-section');
        
        const themeTitle = document.createElement('h3');
        themeTitle.textContent = theme;
        themeTitle.addEventListener('click', () => {
            isQCM = !document.getElementById('quizTypeToggle').checked;
            genereQuizTheme(theme);
        });
        sectionTheme.appendChild(themeTitle);

        const sousThemesContainer = document.createElement('div');
        sousThemesContainer.classList.add('sous-themes-container');

        const sortedSousThemes = sousThemes.sort((a, b) => a.localeCompare(b));

        sortedSousThemes.forEach(sousTheme => {
            const sousThemeElement = document.createElement('div');
            sousThemeElement.classList.add('sub-theme');
            sousThemeElement.textContent = sousTheme;
            sousThemeElement.addEventListener('click', () => {
                isQCM = !document.getElementById('quizTypeToggle').checked;
                genereQuiz(theme, sousTheme);
            });
            sousThemesContainer.appendChild(sousThemeElement);
        });

        sectionTheme.appendChild(sousThemesContainer);
        themesContainer.appendChild(sectionTheme);
    }
}


async function genereQuizTheme(theme) {
    const sousThemes = themes[theme];
    let themeQuestions = [];

    for (const sousTheme of sousThemes) {
        try {
            const normaliserTheme = normaliserString(theme);
            const normaliserSousTheme = normaliserString(sousTheme);
            const url = `data/${normaliserTheme}/${normaliserSousTheme}.json`;

            console.log("Tentative de chargement du fichier:", url);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const sousThemeQuestions = await response.json();
            themeQuestions = themeQuestions.concat(sousThemeQuestions);
        } catch (error) {
            console.error(`Erreur lors du chargement des questions pour ${sousTheme}:`, error);
        }
    }

    if (themeQuestions.length > 0) {
        questions = themeQuestions.sort(() => Math.random() - 0.5);
        idQuestion = 0;
        score = 0;
        afficheQuestionSuivante();
    } else {
        main.innerHTML = `<p>Désolé, aucune question n'a pu être chargée pour le thème ${theme}.</p>`;
    }
}



async function genereQuiz(theme, sousTheme) {

    try {
        const normaliserTheme     = normaliserString(theme);
        const normaliserSousTheme = normaliserString(sousTheme);
        const url                 = `data/${normaliserTheme}/${normaliserSousTheme}.json`;

        console.log("Tentative de chargement du fichier:", url);

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        questions  = await response.json();
        questions  = questions.sort(() => Math.random() - 0.5);
        idQuestion = 0;
        score      = 0;

        afficheQuestionSuivante();

    } catch (error) {
        console.error("Erreur lors du chargement du quiz:", error);
        main.innerHTML = `<p>Erreur lors du chargement du quiz: ${error.message}. Veuillez réessayer.</p>`;
    }

}


function melangerTableau(tableau) {
    for (let i = tableau.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tableau[i], tableau[j]] = [tableau[j], tableau[i]];
    }
    return tableau;
}


function afficheQuestionSuivante() {
    if (idQuestion < questions.length) {
        const question = questions[idQuestion];
        let questionHTML = `
            <div class="quiz-container">
                <h3>Question ${idQuestion + 1}</h3>
                <p>${question.question}</p>`;
        
        if (isQCM) {
            // Mélanger les options
            const optionsMelangees = melangerTableau([...question.options]);
            questionHTML += optionsMelangees.map(option => `
                <label>
                    <input type="radio" name="question" value="${option}">
                    ${option}
                    <br>
                </label>`).join('');
        } else {
            questionHTML += `<textarea id="text-reponse" rows="2" cols="40"></textarea>`;
        }
        
        questionHTML += `
            <br>
            <button id="valider-reponse">Valider</button>
            <button id="quitte-quiz">Quitter</button>
            </div>`;
        
        main.innerHTML = questionHTML;
        document.getElementById('valider-reponse').addEventListener('click', verifieReponse);
        document.getElementById('quitte-quiz').addEventListener('click', quitterQuiz);
        if (!isQCM) {
            document.getElementById('text-reponse').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Empêche le retour à la ligne
                    verifieReponse();
                }
            });
        }
    } else {
        pageResultat();
    }
}


function quitterQuiz()
{
    pageResultat(true);
}


function verifieReponse() {
    const question = questions[idQuestion];
    let reponse;
    let isCorrect = false;
    
    if (isQCM) {
        const reponseSelectionner = document.querySelector('input[name="question"]:checked');
        if (reponseSelectionner) {
            reponse = reponseSelectionner.value;
            isCorrect = normaliserReponse(reponse) === normaliserReponse(question.reponseValide);
        } else {
            reponse = "Aucune réponse sélectionnée";
        }
    } else {
        reponse = document.getElementById('text-reponse').value.trim();
        const reponseNormalisee = normaliserReponse(reponse);
        isCorrect = question.reponsesValides.some(reponseCorrect => {
            const motsReponseCorrect = normaliserReponse(reponseCorrect).split(' ');
            return motsReponseCorrect.some(mot => reponseNormalisee.includes(mot));
        });
    }
    
    if (isCorrect) score++;

    let imagesExplication = '';
    if (question.images && question.images.length > 0) {
        imagesExplication = question.images.map(imageSrc => 
            `<img src="${imageSrc}" alt="Image explication" style="width: 20%; aspect-ratio: 1/1; object-fit: cover; margin-top: 10px;">
`
        ).join('');
    }

    main.innerHTML = 
        `<div class="quiz-container">
            <h3 class="${isCorrect ? 'reponse-correcte' : 'reponse-incorrecte'}">
                ${isCorrect ? 'Réponse correcte' : 'Réponse incorrecte'}
            </h3>
            <p>Votre réponse : ${reponse}</p>
            <p>La bonne réponse est : ${question.reponseValide}</p>
            <p>${question.explication || "Pas d'explication disponible."}</p>
            ${imagesExplication}
            <br>
            <button id="question-suivante">Question suivante</button>
            <button id="quitte-quiz">Quitter</button>
        </div>`;

    idQuestion++;

    document.getElementById('question-suivante').addEventListener('click', () => {
        afficheQuestionSuivante();
    });

    document.getElementById('quitte-quiz').addEventListener('click', quitterQuiz);
}




function pageResultat(quitted = false)
{

    const totalQuestions = quitted ? idQuestion : questions.length;

    main.innerHTML =
        `<div class="quiz-container">
            <h3>Quiz ${quitted ? 'interrompu' : 'terminé'}</h3>
            <p>Votre score : ${score}/${totalQuestions}</p>
            <button id="return-home">Retour à l'accueil</button>
        </div>`;

    document.getElementById('return-home').addEventListener('click', pageAccueil);

}

pageAccueil();