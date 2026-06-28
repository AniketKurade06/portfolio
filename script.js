// Matter.js Tech Stack Animation
const { Engine, Render, Runner, Bodies, Composite, Mouse, MouseConstraint, Events } = Matter;

// Configuration
const canvasContainer = document.querySelector('#canvas-container');
const width = canvasContainer.clientWidth;
const height = canvasContainer.clientHeight;

// Create engine
const engine = Engine.create();
const world = engine.world;

// Create renderer
const render = Render.create({
    element: canvasContainer,
    engine: engine,
    options: {
        width: width,
        height: height,
        wireframes: false,
        background: 'transparent'
    }
});

Render.run(render);

// Create runner
const runner = Runner.create();
Runner.run(runner, engine);

// Boundaries
const wallOptions = { isStatic: true, render: { visible: false } };
const ground = Bodies.rectangle(width / 2, height + 25, width, 50, wallOptions);
const ceiling = Bodies.rectangle(width / 2, -25, width, 50, wallOptions);
const leftWall = Bodies.rectangle(-25, height / 2, 50, height, wallOptions);
const rightWall = Bodies.rectangle(width + 25, height / 2, 50, height, wallOptions);

Composite.add(world, [ground, ceiling, leftWall, rightWall]);

// Tech Stack Data
const techStack = [
    { name: 'HTML', color: '#E34F26' },
    { name: 'CSS', color: '#1572B6' },
    { name: 'JAVA', color: '#007396' },
    { name: 'PYTHON', color: '#3776AB' },
    { name: 'C', color: '#A8B9CC' },
    { name: 'SQL', color: '#4479A1' },
    { name: 'JS', color: '#F7DF1E' },
    { name: 'GITHUB', color: '#6e5494' }
];

// Create circular bodies
const bubbles = techStack.map((tech, index) => {
    const radius = Math.max(width * 0.05, 50);
    const x = Math.random() * (width - radius * 2) + radius;
    const y = Math.random() * (height - radius * 2) + radius;

    const body = Bodies.circle(x, y, radius, {
        restitution: 0.6,
        friction: 0.1,
        render: {
            fillStyle: '#FFFFFF',
            strokeStyle: tech.color,
            lineWidth: 4
        }
    });

    body.techName = tech.name;
    body.accentColor = tech.color;
    return body;
});

Composite.add(world, bubbles);

// Mouse control
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: {
            visible: false
        }
    }
});

Composite.add(world, mouseConstraint);

// Custom rendering for text
Events.on(render, 'afterRender', () => {
    const context = render.context;
    context.font = '700 14px "Inter", sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    bubbles.forEach(body => {
        const { x, y } = body.position;
        const angle = body.angle;

        context.save();
        context.translate(x, y);
        context.rotate(angle);
        context.fillStyle = '#000000';
        context.fillText(body.techName, 0, 0);
        context.restore();
    });
});

// Handle window resize
window.addEventListener('resize', () => {
    const newWidth = canvasContainer.clientWidth;
    const newHeight = canvasContainer.clientHeight;

    render.canvas.width = newWidth;
    render.canvas.height = newHeight;
    render.options.width = newWidth;
    render.options.height = newHeight;

    // Update boundaries
    Matter.Body.setPosition(ground, { x: newWidth / 2, y: newHeight + 25 });
    Matter.Body.setPosition(rightWall, { x: newWidth + 25, y: newHeight / 2 });
});
