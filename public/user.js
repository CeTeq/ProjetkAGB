const urlParams = new URLSearchParams(window.location.search);
const myParam = urlParams.get('err');
const username = urlParams.get('username');
const lastProject = urlParams.get('lastProject');
let projectCards = []
console.log(username);
console.log(myParam);
const error = document.getElementById('error');
if (myParam === "noPermissions") {error.innerHTML = "You do not have permission to access this page!";
}
if(lastProject) {

}


async function getData() {
    const url = "/api/getProjects"
    projectCards = []
    // console.log(document.querySelector('projects-archived').children)
    document.querySelector('.projects-active').innerHTML = ''
    document.querySelector('.projects-archived').innerHTML = ''
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        console.log(json);
        // showNewProjectForm()
        json.forEach(element => {
            const projectContainer = document.createElement('div')
            projectContainer.classList.add('project-container');



            if(element.archived !== 2) {
                const more = document.createElement('mdui-dropdown');
                const dropdownTrigger = document.createElement('mdui-button-icon')
                const dropdownMenu = document.createElement('mdui-menu')
                // const menuItem1 = document.createElement('mdui-menu-item');
                const menuItem2 = document.createElement('mdui-menu-item');

                // menuItem1.innerText = 'Edytuj'
                menuItem2.innerText = 'Zarchiwizuj'
                // menuItem1.addEventListener('click', () => {
                //     editMode();
                // })
                menuItem2.addEventListener('click', (e) => {
                    archiveProject(e.target.closest('.project-container'));
                })
                // dropdownMenu.appendChild(menuItem1);
                dropdownMenu.appendChild(menuItem2);

                dropdownTrigger.setAttribute('icon', 'more_vert')
                dropdownTrigger.setAttribute('slot', 'trigger')

                more.appendChild(dropdownTrigger);
                more.appendChild(dropdownMenu);
                more.classList.add('more-project')
                projectContainer.appendChild(more)
            } else {
                const more = document.createElement('mdui-dropdown');
                const dropdownTrigger = document.createElement('mdui-button-icon')
                const dropdownMenu = document.createElement('mdui-menu')
                const menuItem1 = document.createElement('mdui-menu-item');

                menuItem1.innerText = 'Przywróć';
                menuItem1.addEventListener('click', (e) => {
                    unarchiveProject(e.target.closest('.project-container'));
                })

                dropdownMenu.appendChild(menuItem1);

                dropdownTrigger.setAttribute('icon', 'more_vert')
                dropdownTrigger.setAttribute('slot', 'trigger')

                more.appendChild(dropdownTrigger);
                more.appendChild(dropdownMenu);
                more.classList.add('more-project')
                projectContainer.appendChild(more)
            }
            // projectContainer.appendChild('<mdui-button-icon icon="more_vert" class="more-project"></mdui-button-icon>');
            // more.setAttribute('icon', 'more_vert')
            // more.setAttribute('slot', 'trigger')
            const project = document.createElement("mdui-card")
            project.classList.add("project-card")
            project.innerHTML = `
                    <div>
                    <h3></h3>
                    <div class="company">
                        <img src="./company.svg">
                        <span class="company-name"></span>
                    </div>
                    <div class="description"></div>
                    </div>
                `

            project.href = `/project.html?id=${element.id}`;

            project.querySelector("h3").innerText = element.name;
            project.querySelector(".description").innerText = element.description || "Brak opisu";
            project.querySelector(".company-name").innerText = element.company ? `${element.company.name}; ${element.company.street}` : "N/A";
            // document.body.querySelectorAll('.project').forEach((e)=>{
            //     e.innerHTML = ''
            // })
            projectContainer.appendChild(project)
            if(element.archived === 2) {
                // projectContainer.classList.add('archived')
                document.querySelector('.projects-archived').appendChild(projectContainer);
            } else document.querySelector('.projects-active').appendChild(projectContainer);

            projectCards.push({
                container: projectContainer,
                href: project.href,
                id: element.id
            });
        })
    } catch (error) {
        console.error(error.message);
    }

}
getData();
// const newProjectDim = document.createElement("div");
// newProjectDim.id = 'dim'
// const newProject = document.createElement("div");
// newProject.id = 'newProject'
// newProject.innerHTML = `
//         <img src="close.svg" onclick="i=2" class="cursorPointer">
//         <form id="newProjectForm" action="/api/project/newProject" method="POST">
//             <input type="text" name="name" placeholder="Nazwa">
//             <input type="text" name="street" placeholder="Ulica">
//             <input type="text" name="street_number" placeholder="Numer ulicy">
//             <input type="text" name="post_code" placeholder="Kod pocztowy">
//             <input type="text" name="city" placeholder="Miasto">
//             <input type="date" name="date" size="20">
//             <input type="text" name="description" placeholder="Opis"><br>
//             <input type="submit" value="Dodaj projekt" class="hoverPointer">
//         </form>
//     `
// newProjectDim.classList.add('hidden');

// newProjectDim.appendChild(newProject);
// document.body.append(newProjectDim);
// // document.querySelector('#overlay').addEventListener('click', (e) =>{
//
// // })
// let i = 0
// function showNewProjectForm() {
//     newProjectDim.classList.toggle('hidden');
//     document.body.addEventListener('click',  function listener(e)  {
//         if (document.querySelector('#newProject').style.display !== 'none' && !newProject.contains(e.target)) i++
//         // {
//         // if(i>0){
//         //     newProjectDim.classList.toggle('hidden');
//         //     document.body.removeEventListener('click', listener)
//         //     e.preventDefault()
//         //     i = 0
//         // } else i++
//         // }
//         if(i>1) {
//             newProjectDim.classList.toggle('hidden');
//             document.body.removeEventListener('click', listener)
//             i=0
//         }
//         console.log(i)
//     })
// }
function newProject() {
    const dialog = document.createElement('mdui-dialog');
    dialog.className = 'createProject'
    dialog.setAttribute('close-on-overlay-click', '');
    dialog.innerHTML = `
        <div id="ccas">
            <form method="POST" action="/api/createProject" id="newProjectForm">
                <label>Nazwa projektu:</label>
                <input type="text" id="projectName" name="projectName" required>
                <mdui-button disabled onclick="createProject()" id="createProject">Utwórz</mdui-button>
            </form>
        </div>
    `
    document.body.appendChild(dialog);
    dialog.open = true;
    document.querySelector('#projectName').addEventListener('input', (e) => {
        if(document.querySelector('#projectName').value) {
            document.getElementById('createProject').removeAttribute('disabled')
        }
        else document.getElementById('createProject').setAttribute('disabled', '')
    })
}
function createProject() {

}
function archiveProject(card) {
    const dialog = document.createElement('mdui-dialog')
    const buttonsContainer = document.createElement('div')
    const yes = document.createElement('mdui-button')
    const no = document.createElement('mdui-button')
    const cardName = card.children[1].children[0].children[0].innerText
    const snackBar = document.createElement('mdui-snackbar')
    const id = projectCards.find(el => el.container === card).id
    snackBar.className = 'snack-bar-delete-project';
    snackBar.setAttribute('action', 'Cofnij')
    snackBar.setAttribute('close-on-outside-click', '')
    snackBar.innerText = 'Zarchiwizowano projekt "' + cardName + '".'
    snackBar.addEventListener('action-click', async ()=>{
        card.style.display = 'block';
        await fetch('api/project/archive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                projectID: id,
                archived: 1
            })
        })
        await getData()
        //location.reload()
    })

    document.body.appendChild(snackBar)

    yes.innerText = 'Tak'
    yes.className = 'yesButton'
    yes.setAttribute('variant', 'filled')
    yes.onclick = async function () {
        card.style.display = 'none';
        dialog.open = false
        snackBar.open = true
        await fetch('api/project/archive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                projectID: id,
                archived: 2
            })
        })
        // document.body.querySelectorAll('.project').forEach((e)=>{
        //     e.innerHTML = ''
        // })
        await getData()
        //location.reload()
    }

    console.log(projectCards.find(el => el.container === card).id)
    no.innerText = 'Nie'
    no.className = 'noButton'
    no.setAttribute('variant', 'tonal')
    no.onclick = ()=> {
        dialog.open = false
    }

    buttonsContainer.appendChild(yes)
    buttonsContainer.appendChild(no)

    dialog.className = 'delete-project-dialog'
    document.body.appendChild(dialog)
    dialog.innerHTML = '<div>Czy na pewno chcesz zarchiwizować projekt ' + '<b>' + '"' + cardName + '"' + '</b>' + '?</div>'
    dialog.appendChild(buttonsContainer)
    dialog.open = true
    console.log()

}
function unarchiveProject (card) {
    const dialog = document.createElement('mdui-dialog')
    const buttonsContainer = document.createElement('div')
    const yes = document.createElement('mdui-button')
    const no = document.createElement('mdui-button')
    const cardName = card.children[1].children[0].children[0].innerText
    const snackBar = document.createElement('mdui-snackbar')
    const id = projectCards.find(el => el.container === card).id
    snackBar.className = 'snack-bar-delete-project';
    snackBar.innerText = 'Przywrócono projekt "' + cardName + '".'


    document.body.appendChild(snackBar)

    yes.innerText = 'Tak'
    yes.className = 'yesButton'
    yes.setAttribute('variant', 'filled')
    yes.onclick = async function () {
        card.style.display = 'none';
        dialog.open = false
        snackBar.open = true
        await fetch('api/project/archive', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                projectID: id,
                archived: 1
            })
        })
        await getData()
        ////location.reload()
    }

    console.log(projectCards.find(el => el.container === card).id)
    no.innerText = 'Nie'
    no.className = 'noButton'
    no.setAttribute('variant', 'tonal')
    no.onclick = ()=> {
        dialog.open = false
    }

    buttonsContainer.appendChild(yes)
    buttonsContainer.appendChild(no)

    dialog.className = 'delete-project-dialog'
    document.body.appendChild(dialog)
    dialog.innerHTML = '<div>Czy chcesz przywrócić projekt ' + '<b>' + '"' + cardName + '"' + '</b>' + '?</div>'
    dialog.appendChild(buttonsContainer)
    dialog.open = true
    console.log()
}
