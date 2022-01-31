function novoElemento(tagName, className) {
    const elem = document.createElement(tagName)
    // elem.classList.add = className
    elem.className = className

    return elem
}

class Barreira {
    constructor(reversa = false) {
        // o this é usado para que seja visível fora da função ou classe
        this.elemento = novoElemento('div', 'barreira')

        const borda = novoElemento('div', 'borda')
        const corpo = novoElemento('div', 'corpo')

        // primeira barreira
        if (reversa) {
            this.elemento.appendChild(corpo)
        } else {
            this.elemento.appendChild(borda)
        }

        // segunda barreira
        if (reversa) {
            this.elemento.appendChild(borda)
        } else {
            this.elemento.appendChild(corpo)
        }

        this.setAltura = altura => corpo.style.height = `${altura}px`
    }
}

class ParDeBarreiras{
    constructor(altura, aberturaEntreBarreiras, posicao) {
        this.elemento = novoElemento('div', 'par-de-barreiras')

        this.superior = new Barreira(true)
        this.inferior = new Barreira(false)

        this.elemento.appendChild(this.superior.elemento)
        this.elemento.appendChild(this.inferior.elemento)

        this.sortearAbertura = () => {
            const alturaSuperior = Math.random() * (altura - aberturaEntreBarreiras)
            const alturaInferior = altura - aberturaEntreBarreiras - alturaSuperior

            this.superior.setAltura(alturaSuperior)
            this.inferior.setAltura(alturaInferior)
        }

        // getX pega a posição em que o par de barreiras está no eixo horizontal.
        // O valor this.elemento.style.left é uma string com o valor + px.
        // O split divide a string a partir do px. O valor [0] pega o primeiro valor.
        this.getX = () => parseInt(this.elemento.style.left.split('px')[0])
        this.setX = x => this.elemento.style.left = `${x}px` // configura o valor da largura
        this.getLargura = () => this.elemento.clientWidth

        this.sortearAbertura()
        this.setX(posicao)
    }
}

class ConjuntoBarreiras {
    constructor(altura, largura, aberturaEntreBarreiras, espacoEntreBarreiras, notificarPonto) {
        this.pares = [
            new ParDeBarreiras(altura, aberturaEntreBarreiras, largura),
            new ParDeBarreiras(altura, aberturaEntreBarreiras, largura + espacoEntreBarreiras),
            new ParDeBarreiras(altura, aberturaEntreBarreiras, largura + espacoEntreBarreiras * 2),
            new ParDeBarreiras(altura, aberturaEntreBarreiras, largura + espacoEntreBarreiras * 3)
        ]

        const deslocamento = 3 // de quantos em quantos pixels será o deslocamento

        this.animar = () => {
            this.pares.forEach(par => {
                par.setX(par.getX() - deslocamento)

                // Quando o elemento sair da área do jogo, será colocado na última posição
                if(par.getX() < -par.getLargura()) {
                    par.setX(par.getX() + espacoEntreBarreiras * this.pares.length)
                    par.sortearAbertura()
                }

                // Verifica se o par de barreiras cruzou o meio da tela.
                // Se sim, contabiliza um ponto.
                const meio = largura / 2
                const cruzouOMeio = par.getX() + deslocamento >= meio && par.getX() < meio

                if(cruzouOMeio) {
                    notificarPonto()
                }
            })
        }
    }
}

class Passaro {
    constructor(alturaJogo) {
        let voando = false

        this.elemento = novoElemento('img', 'passaro')
        this.elemento.src = 'imgs/passaro.png'

        this.getY = () => parseInt(this.elemento.style.bottom.split('px')[0])
        this.setY = y => this.elemento.style.bottom = `${y}px`

        window.onkeydown = e => voando = true // Quanto apertar a tecla
        window.onkeyup = e => voando = false // Quando soltar a tecla

        this.animar = () => {
            const novoY = this.getY() + (voando ? 8 : -5)
            const alturaMaxima = alturaJogo - this.elemento.clientHeight

            // Configurando a altura
            if(novoY <= 0) { // Se a nova altura for menor que o chão, seta 0.
                this.setY(0)
            } else if(novoY >= alturaMaxima) { // Se for mais alta que a altura, seta a altura máxima.
                this.setY(alturaMaxima)
            } else { // Caso contrário, seta a nova altura.
                this.setY(novoY)
            }
        }

        // Altura inicial
        this.setY(alturaJogo / 2)
    }
}

class Progresso {
    constructor() {
        this.elemento = novoElemento('span', 'progresso')

        this.atualizarPontos = pontos => {
            this.elemento.innerHTML = pontos
        }

        this.atualizarPontos(0)
    }
}

class GameOver {
    constructor(texto) {
        this.elemento = novoElemento('span', 'game-over')
        this.elemento.innerHTML = texto
    }
}

function estaoSobrepostos(elementoA, elementoB) {
    const a = elementoA.getBoundingClientRect() // Pega o retângulo associado ao elementoA
    const b = elementoB.getBoundingClientRect() // Pega o retângulo associado ao elementoB

    // Verifica se há sobreposição horizontal
    const horizontal = a.left + a.width >= b.left && b.left + b.width >= a.left
    // Verifica se há sobreposição vertical
    const vertical = a.top + a.height >= b.top && b.top + b.height >= a.top

    // Se houver colisão tanto horizontal, quanto vertical, o retorno será verdadeiro
    return horizontal && vertical
}

function colidiu(passaro, barreiras) {
    let colidiu = false

    barreiras.pares.forEach(par => {
        if(!colidiu) {
            const superior = par.superior.elemento
            const inferior = par.inferior.elemento

            colidiu = estaoSobrepostos(passaro.elemento, superior)
                || estaoSobrepostos(passaro.elemento, inferior)
        }
    })

    return colidiu
}

class FlappyBird {
    constructor() {
        let pontos = 0

        const areaDoJogo = document.querySelector('[wm-flappy]')
        const altura = areaDoJogo.clientHeight
        const largura = areaDoJogo.clientWidth

        const progresso = new Progresso()
        const gameOver = new GameOver('GAME OVER')

        const barreiras = new ConjuntoBarreiras(altura, largura, 200, 400,
            () => progresso.atualizarPontos(++pontos))

        const passaro = new Passaro(altura)

        areaDoJogo.appendChild(progresso.elemento)
        areaDoJogo.appendChild(passaro.elemento)
        barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento))

        this.start = () => {
            // loop do jogo
            const temporizador = setInterval(() => {
                barreiras.animar()
                passaro.animar()

                if(colidiu(passaro, barreiras)) {
                    clearInterval(temporizador)
                    areaDoJogo.appendChild(gameOver.elemento)
                }
            }, 20)
        }
    }
}

new FlappyBird().start()