// ============================================================
// Miss Aria Adventures
// Detective Mystery Mode
// detectiveMystery.js
// Part 1A
// ============================================================



// ============================================================
// MYSTERY CASES
// ============================================================

const cases = [

{

id:1,

title:"🩸 The Mansion Murder",

location:"🏰 Blackwood Mansion",

description:
"A wealthy businessman was found dead inside his locked mansion.",


victim:
"Richard Blackwood",


killer:
"Thomas Blackwood",


weapon:
"Poisoned Wine",


clues:[

"🍷 Strange wine glass",

"📜 Hidden inheritance document",

"👞 Mud footprints near window",

"📱 Deleted phone message"

],


suspects:[

{

name:"Thomas Blackwood",

role:"Brother",

secret:
"Wanted the inheritance"

},


{

name:"Emily Rose",

role:"Assistant",

secret:
"Knew about the victim's secrets"

},


{

name:"James Carter",

role:"Business Partner",

secret:
"Had financial problems"

}

]


},


{

id:2,

title:"🏦 The Missing Diamond",

location:"💎 Royal Museum",

description:
"A priceless diamond disappeared during an exhibition.",


victim:
"None",


killer:
"Unknown Thief",


weapon:
"None",


clues:[

"🧤 Black glove",

"📹 Broken camera",

"🔑 Duplicate key"

],


suspects:[

{

name:"Museum Guard",

role:"Security",

secret:
"Left his station"

},


{

name:"Collector",

role:"Visitor",

secret:
"Wanted the diamond"

}

]


}

];



// ============================================================
// START GAME
// ============================================================

function start(session){


    const mystery =

        cases[

            Math.floor(

                Math.random()
                *
                cases.length

            )

        ];



    session.state = {


        case:mystery,


        clues:[],


        evidence:[],


        suspects:mystery.suspects,


        solved:false,


        attempts:0


    };



    return {


text:

`🕵️ DETECTIVE MYSTERY


Case:

${mystery.title}


📍 Location:

${mystery.location}


${mystery.description}



Your mission:

Find the truth.


Commands:

🔎 search

👥 suspects

🧩 clues

🗣 question

⚖️ accuse`

    };


}



// ============================================================
// SHOW CASE
// ============================================================

function showCase(session){


const c =
session.state.case;



return {


text:

`📁 CASE FILE


${c.title}


📍 ${c.location}


${c.description}


Victim:

${c.victim}

`

};


}
// ============================================================
// DETECTIVE MYSTERY
// Part 1B
// Investigation + Clues + Evidence Search
// ============================================================



// ============================================================
// SEARCH CRIME SCENE
// ============================================================

function searchScene(session){


    const mystery =
        session.state.case;



    const availableClues =
        mystery.clues;



    const hiddenClues =
        availableClues.filter(

            clue =>

            !session.state.clues.includes(clue)

        );



    if(hiddenClues.length === 0){


        return {


text:

`🔎 You searched everywhere.


No new clues found.

Maybe question the suspects.`

        };


    }



    const clue =

        hiddenClues[

            Math.floor(

                Math.random()

                *

                hiddenClues.length

            )

        ];



    session.state.clues.push(clue);



    return {


text:

`🔎 INVESTIGATION


You searched the crime scene.


New clue discovered:


🧩 ${clue}


Evidence added.`

    };


}



// ============================================================
// SHOW CLUES
// ============================================================

function showClues(session){


    const clues =
        session.state.clues;



    return {


text:

`🧩 COLLECTED CLUES


${
clues.length

?

clues.join("\n")

:

"No clues discovered yet."

}`

    };


}



// ============================================================
// SHOW SUSPECTS
// ============================================================

function showSuspects(session){


    const suspects =
        session.state.suspects;



return {


text:

`👥 SUSPECT LIST


${
suspects.map(

(s,index)=>

`${index+1}. ${s.name}

Role:
${s.role}`

).join("\n\n")

}`

};


}



// ============================================================
// FIND HIDDEN EVIDENCE
// ============================================================

function findEvidence(session){



const evidence = [


"🧬 Fingerprint",

"📸 Security Photo",

"📄 Secret Document",

"🔑 Hidden Key",

"💬 Suspicious Conversation"


];



const item =

evidence[

Math.floor(

Math.random()

*

evidence.length

)

];



if(
!session.state.evidence.includes(item)

){


session.state.evidence.push(item);



return {


text:

`🧠 FORENSIC DISCOVERY


You discovered:


${item}


This may reveal the truth.`

};


}



return {


text:

`🧠 You found nothing new.`

};


}



// ============================================================
// INVESTIGATION SCORE
// ============================================================

function investigationScore(session){


const clues =
session.state.clues.length;


const evidence =
session.state.evidence.length;



const score =

(clues * 20)

+

(evidence * 10);



return {


score,


text:

`📊 INVESTIGATION SCORE


🧩 Clues:

${clues}


🧠 Evidence:

${evidence}


⭐ Score:

${score}/100`

};


}



// ============================================================
// RANDOM INVESTIGATION EVENT
// ============================================================

function randomInvestigationEvent(session){



const events = [


"👣 You discovered strange footprints.",


"📱 A hidden message appears on a phone.",


"🚪 A secret room was discovered.",


"🕯 Someone was watching you."


];



const event =

events[

Math.floor(

Math.random()

*

events.length

)

];



return {


text:

`🚨 INVESTIGATION EVENT


${event}`

};


}
// ============================================================
// DETECTIVE MYSTERY
// Part 2A
// Interrogation + Lie Detection + Suspect System
// ============================================================



// ============================================================
// QUESTION SUSPECT
// ============================================================

function questionSuspect(session, suspectIndex = 0){


    const suspects =
        session.state.suspects;



    const suspect =
        suspects[suspectIndex];



    if(!suspect){


        return {


text:

`❌ Suspect not found.`

        };


    }



    const reactions = [

        "They look nervous and avoid eye contact.",

        "They answer quickly, maybe too quickly.",

        "They seem calm but something feels wrong.",

        "They become defensive."

    ];



    const reaction =

    reactions[

        Math.floor(

            Math.random()

            *

            reactions.length

        )

    ];



    return {


text:

`🗣 INTERROGATION


You question:


👤 ${suspect.name}


Role:

${suspect.role}



Their reaction:


${reaction}



Secret information:

${suspect.secret}



Look for contradictions.`

    };


}



// ============================================================
// LIE DETECTOR
// ============================================================

function detectLie(session, suspectIndex = 0){



    const suspect =
        session.state.suspects[suspectIndex];



    if(!suspect){


        return {


text:

"❌ Invalid suspect."

        };


    }



    const chance =
        Math.random();



    if(chance < 0.50){


        return {


text:

`🧠 LIE DETECTOR


${suspect.name}

is hiding something.


⚠️ Their story has contradictions.`

        };


    }



    return {


text:

`🧠 LIE DETECTOR


${suspect.name}

appears honest...


but more evidence is needed.`

    };


}



// ============================================================
// COMPARE EVIDENCE
// ============================================================

function compareEvidence(session){


    const clues =
        session.state.clues;


    const evidence =
        session.state.evidence;



    if(
        clues.length < 2 &&
        evidence.length < 1
    ){


        return {


text:

`❌ Not enough evidence.


Find more clues first.`

        };


    }



    let result =

`🧩 EVIDENCE ANALYSIS


`;



    if(
        clues.includes("🍷 Strange wine glass")
    ){


        result +=

`🍷 The wine may be connected to the murder.


`;

    }



    if(
        evidence.includes("🧬 Fingerprint")
    ){


        result +=

`🧬 Fingerprints could identify the criminal.


`;

    }



    if(
        evidence.includes("📄 Secret Document")
    ){


        result +=

`📄 The document reveals a hidden motive.


`;

    }



    result +=

"Keep investigating.";



    return {


text:result

    };


}



// ============================================================
// CREATE SUSPECT PROFILE
// ============================================================

function suspectProfile(session){



const profiles =

session.state.suspects.map(

(s,index)=>

`
${index+1}.

👤 ${s.name}

Role:
${s.role}

Possible motive:
${s.secret}
`

);



return {


text:

`📋 SUSPECT PROFILES


${profiles.join("\n")}`

};


}



// ============================================================
// DETECTIVE NOTES
// ============================================================

function addNote(session,note){


    if(!session.state.notes){


        session.state.notes=[];

    }



    session.state.notes.push(note);



    return {


text:

`📝 Detective note saved:


${note}`

    };


}



// ============================================================
// SHOW NOTES
// ============================================================

function showNotes(session){



return {


text:

`📝 DETECTIVE NOTES


${
session.state.notes?.length

?

session.state.notes.join("\n")

:

"No notes yet."

}`

};


}
// ============================================================
// DETECTIVE MYSTERY
// Part 2B
// Accusation + Case Solving + Endings
// ============================================================



// ============================================================
// ACCUSE SUSPECT
// ============================================================

function accuse(session, suspectName){


    const mystery =
        session.state.case;



    if(!suspectName){


        return {


text:

`⚖️ ACCUSATION


Provide a suspect name.

Example:

accuse Thomas Blackwood`

        };


    }



    session.state.attempts++;



    const correct =

    suspectName.toLowerCase()

    ===

    mystery.killer.toLowerCase();



    if(correct){


        return solveCase(session);

    }



    return {


text:

`❌ WRONG ACCUSATION


You accused:

${suspectName}


The evidence does not support this.


⚠️ Investigation damaged.


Attempts:

${session.state.attempts}`

    };


}



// ============================================================
// SOLVE CASE
// ============================================================

function solveCase(session){



    const mystery =
        session.state.case;



    session.state.solved =
        true;



    const score =

    investigationScore(session).score;



    let ending =

`🏆 CASE SOLVED!


🕵️ Detective Report


Case:

${mystery.title}


The criminal was:


👤 ${mystery.killer}


Method:

${mystery.weapon}


Investigation Score:

${score}/100



`;



    if(score >= 80){


        ending +=

`🌟 PERFECT INVESTIGATION


Your detective skills are legendary.

The police reward you for solving the case.`;

    }


    else if(score >= 40){


        ending +=

`✅ CASE CLOSED


You solved it...

but some mysteries remain.`;

    }


    else{


        ending +=

`😐 LUCKY SOLUTION


You found the answer,

but your evidence was weak.`;

    }



    return {


text:ending

    };


}



// ============================================================
// CASE FAILURE
// ============================================================

function failCase(session){



session.state.solved =
false;



return {


text:

`🚨 CASE FAILED


The criminal escaped.


The mystery remains unsolved.


Better luck next investigation.`

};



}



// ============================================================
// CASE STATUS
// ============================================================

function caseStatus(session){



const mystery =
session.state.case;



return {


text:

`📁 CASE STATUS


${mystery.title}


Solved:

${
session.state.solved

?

"✅ Yes"

:

"❌ No"

}



Attempts:

${session.state.attempts}



Clues:

${session.state.clues.length}



Evidence:

${session.state.evidence.length}`

};


}



// ============================================================
// MULTIPLE ENDINGS
// ============================================================

function mysteryEnding(session){



if(
session.state.solved
){


return {


title:"🏆 Master Detective",

text:

`You solved the mystery.

Your reputation as a detective grows.`

};


}



if(
session.state.attempts >= 3
){


return {


title:"❌ Failed Detective",

text:

`Too many wrong accusations.

The case went cold.`

};


}



return {


title:"🔎 Investigation Continues",

text:

`The truth is still hidden.

More clues await.`

};


}



// ============================================================
// RESET CASE
// ============================================================

function resetCase(session){



session.state = null;



return start(session);


}
// ============================================================
// DETECTIVE MYSTERY
// Part 3A
// AI Detective Master + Memory + Dynamic Events
// ============================================================



// ============================================================
// DETECTIVE MEMORY SYSTEM
// ============================================================

function addHistory(session, action){


    if(!session.history){

        session.history = [];

    }



    session.history.push({

        action,

        time: Date.now()

    });



    // Keep only latest 50 actions

    if(session.history.length > 50){

        session.history.shift();

    }


}



// ============================================================
// GET INVESTIGATION HISTORY
// ============================================================

function getHistory(session){


    return session.history || [];


}



// ============================================================
// AI DETECTIVE MASTER PROMPT
// ============================================================

function buildDetectivePrompt(session, action){


const mystery =
session.state.case;



return `

You are Miss Aria, Detective Master.


You control a realistic detective mystery.


CASE:

${mystery.title}


LOCATION:

${mystery.location}


CRIME:

${mystery.description}



DETECTIVE:

Name:

${session.player?.name || "Detective"}



CURRENT INVESTIGATION:

Clues found:

${session.state.clues.join(", ") || "None"}



Evidence found:

${session.state.evidence.join(", ") || "None"}



Suspects:

${session.state.suspects
.map(s => s.name)
.join(", ")}



Player Action:

${action}



RULES:

- Create cinematic detective scenes.
- Never reveal the killer immediately.
- Give logical clues.
- Allow false leads.
- Make suspects behave differently.
- Reward smart investigation.
- Keep the mystery challenging.
- Responses should be under 250 words.


`;

}



// ============================================================
// RANDOM CRIME EVENTS
// ============================================================

function randomCrimeEvent(session){



const events = [


{

title:"📞 Anonymous Call",

text:
"Someone calls you and says they know who the killer is."

},



{

title:"🚪 Secret Room",

text:
"You discover a hidden room containing unknown evidence."

},



{

title:"📸 Surveillance Footage",

text:
"A security camera recording becomes available."

},



{

title:"🧤 Missing Evidence",

text:
"Someone attempted to remove evidence from the scene."

},



{

title:"👤 Mysterious Stranger",

text:
"A stranger gives you information about the case."

}


];



const event =

events[

Math.floor(

Math.random()

*

events.length

)

];



return {


title:event.title,


text:

`🚨 NEW DEVELOPMENT


${event.text}`

};


}



// ============================================================
// PRESSURE SUSPECT
// ============================================================

function pressureSuspect(session, index = 0){


const suspect =

session.state.suspects[index];



if(!suspect){


return {


text:

"❌ Suspect not found."

};

}



const reactions = [


"😰 They become nervous and change their story.",


"😡 They get angry and defensive.",


"😶 They refuse to answer.",


"😳 They reveal a small detail."

];



const reaction =

reactions[

Math.floor(

Math.random()

*

reactions.length

)

];



return {


text:

`🕵️ PRESSURE INTERROGATION


Suspect:

${suspect.name}


Reaction:

${reaction}


Keep analyzing their behavior.`

};


}



// ============================================================
// DETECTIVE RANK
// ============================================================

function detectiveRank(session){


const score =

investigationScore(session).score;



let rank =
"Rookie Detective";



if(score >= 80){

rank =
"🧠 Master Detective";

}

else if(score >= 50){

rank =
"🔎 Skilled Investigator";

}

else if(score >= 20){

rank =
"🕵️ Detective";

}



return {


text:

`🏅 DETECTIVE RANK


${rank}


Investigation Score:

${score}/100`

};


}
// ============================================================
// DETECTIVE MYSTERY
// Part 3B
// Keyboard + Router + Save + Exports
// ============================================================



// ============================================================
// DETECTIVE KEYBOARD
// ============================================================

function getKeyboard(){


return [

    [
        "🔎 Search",
        "🧩 Clues"
    ],

    [
        "👥 Suspects",
        "🗣 Question"
    ],

    [
        "🧠 Evidence",
        "📋 Status"
    ],

    [
        "⚖️ Accuse"
    ]

];


}



// ============================================================
// GAME COMMAND ROUTER
// ============================================================

function handleInput(session,input){


input =

input.toLowerCase().trim();



addHistory(
    session,
    input
);



switch(input){



case "search":

case "🔎 search":

    return searchScene(session);



case "clues":

case "🧩 clues":

    return showClues(session);



case "suspects":

case "👥 suspects":

    return showSuspects(session);



case "question":

case "🗣 question":

    return questionSuspect(session,0);



case "evidence":

case "🧠 evidence":

    return compareEvidence(session);



case "profile":

    return suspectProfile(session);



case "notes":

    return showNotes(session);



case "status":

case "📋 status":

    return caseStatus(session);



case "event":

    return randomCrimeEvent(session);



case "rank":

    return detectiveRank(session);



case "solve":

    return solveCase(session);



case "restart":

    return resetCase(session);



default:


return {


text:

`🕵️ Detective Commands


🔎 search

🧩 clues

👥 suspects

🗣 question

🧠 evidence

📋 status

🏅 rank

🚨 event

⚖️ accuse

🔄 restart`

};



}


}



// ============================================================
// SAVE SYSTEM
// ============================================================

function saveGame(session){


return {


success:true,


data:{

state:
session.state,

history:
session.history || []

}


};


}



// ============================================================
// LOAD GAME
// ============================================================

function loadGame(session,data){



if(!data){

return false;

}



session.state =
data.state;



session.history =
data.history || [];



return true;


}



// ============================================================
// RESET DETECTIVE
// ============================================================

function restart(session){



session.state = null;


session.history = [];



return start(session);


}



// ============================================================
// EXPORTS
// ============================================================

module.exports = {


// Start

start,

showCase,



// Investigation

searchScene,

showClues,

showSuspects,

findEvidence,

investigationScore,

randomInvestigationEvent,



// Interrogation

questionSuspect,

detectLie,

compareEvidence,

suspectProfile,

pressureSuspect,

addNote,

showNotes,



// Solving

accuse,

solveCase,

failCase,

caseStatus,

mysteryEnding,

resetCase,



// AI

addHistory,

getHistory,

buildDetectivePrompt,

randomCrimeEvent,



// Rank

detectiveRank,



// Router

handleInput,



// UI

getKeyboard,



// Save

saveGame,

loadGame,

restart

};