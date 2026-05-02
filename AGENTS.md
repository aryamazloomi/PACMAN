You are a senior software engineer, game developer, and machine learning engineer.

I want you to build a complete Pac-Man-style app as a polished portfolio project.

IMPORTANT FIRST STEP:
Before coding, read the project Markdown file in this repository. (deep-research-report.md) It contains the full research and planning for the Pac-Man AI/ML project. Use it as the main project specification. The Markdown file explains that the app should support manual play, multiple selectable AI agents, and a clean architecture separating gameplay, controller logic, and ML agents.

Project goal:
Create a playable Pac-Man-style game where the user can either:
1. Play manually with keyboard controls
2. Select different AI/ML agents to control Pac-Man
3. Compare how different agents perform

Core architecture requirements:
- Separate the project into:
  - Game core
  - Rendering/UI
  - Controller system
  - AI/ML agent system
  - Training/evaluation utilities
- The game core should not depend directly on keyboard input.
- Manual player and AI agents must use the same action API.
- Use a clean Controller interface, for example:
  - select_action(game_state) -> action
- The system should support swapping controllers from a menu.
- Keep rendering separate from training/headless simulation.
- Add trajectory logging so manual play and AI play can be saved for future behavioral cloning or analysis.

Recommended tech stack:
- Python
- Pygame for the playable game and rendering
- Gymnasium-compatible environment interface if practical
- NumPy for state/grid logic
- Optional but preferred: scikit-learn for simple ML baselines
- Optional later: PyTorch or Stable-Baselines3 structure, but do not overcomplicate the first version

Build this as an MVP first, but make the architecture extensible.

Game requirements:
- Pac-Man-style grid maze
- Walls
- Pellets
- Power pellets
- Pac-Man movement
- Ghost movement
- Collision detection
- Score system
- Lives
- Win/loss conditions
- Restart game
- Basic menu screen
- Agent selection screen
- Display current score, lives, selected controller, and episode stats

Controls:
- Arrow keys or WASD for manual play
- ESC to pause or quit
- R to restart
- Menu option to choose controller/agent

AI agents to implement in phases:

Phase 1 — Must implement:
1. HumanController
   - Keyboard/manual play

2. RandomAgent
   - Chooses random legal moves
   - Useful baseline

3. GreedyPelletAgent
   - Moves toward the nearest pellet using shortest path or simple distance heuristic

4. GhostAvoidanceAgent
   - Avoids nearby ghosts
   - Prioritizes survival over score

5. AStarAgent
   - Uses A* pathfinding to target pellets, power pellets, or safe tiles
   - Should avoid obvious ghost danger zones

Phase 2 — Implement if time allows:
6. BehaviorTreeAgent
   - High-level logic:
     - If ghost is dangerous and near, flee
     - Else if ghost is frightened and reachable, chase ghost
     - Else if power pellet is useful, go to power pellet
     - Else go to best pellet
   - This should be a strong non-ML baseline

7. TabularQLearningAgent
   - Use compact engineered state features
   - Example features:
     - Pac-Man grid position or region
     - nearest pellet direction
     - nearest ghost distance bucket
     - frightened ghost flag
     - legal moves mask
   - Include training loop, save/load Q-table, and evaluation

8. SarsaAgent
   - Similar state abstraction to Q-learning
   - Include training loop and save/load support

Phase 3 — Prepare structure, but do not fully implement unless the project is stable:
9. BehavioralCloningAgent
   - Use logged human/scripted trajectories later
   - Create placeholder files and TODOs for dataset loading/training

10. DQNAgent or PPOAgent
   - Create clean extension points for deep RL
   - Do not force heavy dependencies unless needed
   - Add TODO documentation for future Stable-Baselines3/PyTorch integration

Important design principle:
Start with a working playable game first. Then add agents one by one. Do not build an overengineered ML system before the game works.

Suggested project structure:

pacman-ai/
  README.md
  requirements.txt
  main.py
  pacman/
    __init__.py
    game/
      __init__.py
      constants.py
      maze.py
      entities.py
      game_state.py
      engine.py
      rewards.py
    render/
      __init__.py
      pygame_renderer.py
      menu.py
    controllers/
      __init__.py
      base.py
      human.py
      random_agent.py
      greedy_pellet.py
      ghost_avoidance.py
      astar_agent.py
      behavior_tree.py
    rl/
      __init__.py
      gym_env.py
      q_learning.py
      sarsa.py
      train_q_learning.py
      train_sarsa.py
      evaluate.py
    utils/
      __init__.py
      pathfinding.py
      logger.py
      replay.py
      metrics.py
  data/
    trajectories/
    q_tables/
  tests/
    test_movement.py
    test_collisions.py
    test_pathfinding.py
    test_agents.py

Coding standards:
- Write clean, readable, beginner-friendly Python.
- Add comments where logic is non-obvious.
- Use type hints where helpful.
- Avoid huge files.
- Keep each class focused.
- Do not hardcode everything inside main.py.
- Make the app easy to run with:
  python main.py
- Include requirements.txt.
- Include a clear README with setup, run instructions, controls, and agent descriptions.

Evaluation requirements:
Add a simple evaluation script that can run an agent for N episodes and report:
- average score
- average survival time
- pellets eaten
- win rate
- death count
- average action latency if practical

Trajectory logging:
Log each step with:
- observation/state
- action
- reward
- score
- done flag
- controller/agent name
- timestamp or step number

The logs should be saved in a simple JSONL or CSV format so they can later be used for behavioral cloning.

Environment API:
If practical, implement a Gymnasium-style wrapper with:
- reset()
- step(action)
- render()
- close()
- observation_space
- action_space

Actions:
Use a project-level action enum:
- UP
- DOWN
- LEFT
- RIGHT
- STOP or NOOP if useful

The custom game should expose legal actions so agents do not constantly hit walls.

Reward design:
Use real game score as the main reward.
For RL training, include optional shaped rewards:
- pellet eaten: positive
- power pellet eaten: positive
- ghost eaten while frightened: positive
- life lost: negative
- wall bump or invalid move: small negative
- level cleared: large positive
- dithering/repeating: small negative if needed

Keep shaped reward separate from displayed game score.

User interface:
Create a simple menu where I can choose:
- Manual
- Random Agent
- Greedy Pellet Agent
- Ghost Avoidance Agent
- A* Agent
- Behavior Tree Agent, if implemented
- Q-Learning Agent, if trained/available
- SARSA Agent, if trained/available

The menu does not need to be fancy, but it should be clean and usable.

Visual style:
- Classic Pac-Man-inspired look
- Dark background
- Bright maze walls
- Yellow Pac-Man
- Colored ghosts
- Pellets and power pellets visible
- Smooth enough movement for demo purposes

Testing:
Add basic unit tests for:
- Maze loading
- Legal moves
- Wall collision
- Pellet collection
- Ghost collision
- A* pathfinding
- RandomAgent returns legal action
- Greedy agent selects reasonable direction

Development process:
1. Read the Markdown file first.
2. Summarize the architecture you will implement.
3. Inspect the current repository structure.
4. Create or update files carefully.
5. Build the playable manual version first.
6. Add RandomAgent.
7. Add GreedyPelletAgent.
8. Add GhostAvoidanceAgent.
9. Add AStarAgent.
10. Add logging and evaluation.
11. Add Gymnasium-style wrapper if practical.
12. Add Q-learning/SARSA structure if the core is stable.
13. Run tests.
14. Run the game manually or provide instructions for me to run it.
15. Update README.

Very important:
- Do not delete existing files unless clearly unnecessary.
- Do not overwrite important user work without checking the file contents first.
- Keep the app runnable at every stage.
- Prefer a working MVP over a broken advanced system.
- If a feature is too large, create a clean TODO and explain what remains.

Deliverables:
- Working Pac-Man-style game
- Manual play
- Selectable agents
- At least Random, Greedy, GhostAvoidance, and A* agents
- Clean project structure
- README
- requirements.txt
- Basic tests
- Evaluation script
- Trajectory logging
- Clear next-step TODOs for Q-learning, SARSA, Behavioral Cloning, DQN/PPO

After implementation, give me:
1. What you built
2. How to run it
3. Which agents work
4. What is still TODO
5. Any bugs or limitations
6. Suggested next development step