define(["entity","transition","timer"],function(Entity,Transition,Timer){var Character=Entity.extend({init:function(id,kind){var self=this;this._super(id,kind);this.nextGridX=-1;this.nextGridY=-1;this.orientation=Types.Orientations.DOWN;this.atkSpeed=50;this.moveSpeed=120;this.walkSpeed=100;this.idleSpeed=450;this.setAttackRate(800);this.movement=new Transition;this.path=null;this.newDestination=null;this.adjacentTiles={};this.target=null;this.unconfirmedTarget=null;this.attackers={};this.hitPoints=0;this.maxHitPoints=0;this.isDead=false;this.attackingMode=false;this.followingMode=false;this.inspecting=null},clean:function(){this.forEachAttacker(function(attacker){attacker.disengage();attacker.idle()})},setMaxHitPoints:function(hp){this.maxHitPoints=hp;this.hitPoints=hp},setDefaultAnimation:function(){this.idle()},hasWeapon:function(){return false},hasShadow:function(){return true},animate:function(animation,speed,count,onEndCount){var oriented=["atk","walk","idle"],o=this.orientation;if(!(this.currentAnimation&&this.currentAnimation.name==="death")){this.flipSpriteX=false;this.flipSpriteY=false;if(_.indexOf(oriented,animation)>=0){animation+="_"+(o===Types.Orientations.LEFT?"right":Types.getOrientationAsString(o));this.flipSpriteX=this.orientation===Types.Orientations.LEFT?true:false}this.setAnimation(animation,speed,count,onEndCount)}},turnTo:function(orientation){this.orientation=orientation;this.idle()},setOrientation:function(orientation){if(orientation){this.orientation=orientation}},idle:function(orientation){this.setOrientation(orientation);this.animate("idle",this.idleSpeed)},hit:function(orientation){this.setOrientation(orientation);this.animate("atk",this.atkSpeed,1)},walk:function(orientation){this.setOrientation(orientation);this.animate("walk",this.walkSpeed)},moveTo_:function(x,y,callback){this.destination={gridX:x,gridY:y};this.adjacentTiles={};if(this.isMoving()){this.continueTo(x,y)}else{var path=this.requestPathfindingTo(x,y);this.followPath(path)}},requestPathfindingTo:function(x,y){if(this.request_path_callback){return this.request_path_callback(x,y)}else{log.error(this.id+" couldn't request pathfinding to "+x+", "+y);return[]}},onRequestPath:function(callback){this.request_path_callback=callback},onStartPathing:function(callback){this.start_pathing_callback=callback},onStopPathing:function(callback){this.stop_pathing_callback=callback},followPath:function(path){if(path.length>1){this.path=path;this.step=0;if(this.followingMode){path.pop()}if(this.start_pathing_callback){this.start_pathing_callback(path)}this.nextStep()}},continueTo:function(x,y){this.newDestination={x:x,y:y}},updateMovement:function(){var p=this.path,i=this.step;if(p[i][0]<p[i-1][0]){this.walk(Types.Orientations.LEFT)}if(p[i][0]>p[i-1][0]){this.walk(Types.Orientations.RIGHT)}if(p[i][1]<p[i-1][1]){this.walk(Types.Orientations.UP)}if(p[i][1]>p[i-1][1]){this.walk(Types.Orientations.DOWN)}},updatePositionOnGrid:function(){this.setGridPosition(this.path[this.step][0],this.path[this.step][1])},nextStep:function(){var stop=false,x,y,path;if(this.isMoving()){if(this.before_step_callback){this.before_step_callback()}this.updatePositionOnGrid();this.checkAggro();if(this.interrupted){stop=true;this.interrupted=false}else{if(this.hasNextStep()){this.nextGridX=this.path[this.step+1][0];this.nextGridY=this.path[this.step+1][1]}if(this.step_callback){this.step_callback()}if(this.hasChangedItsPath()){x=this.newDestination.x;y=this.newDestination.y;path=this.requestPathfindingTo(x,y);this.newDestination=null;if(path.length<2){stop=true}else{this.followPath(path)}}else if(this.hasNextStep()){this.step+=1;this.updateMovement()}else{stop=true}}if(stop){this.path=null;this.idle();if(this.stop_pathing_callback){this.stop_pathing_callback(this.gridX,this.gridY)}}}},onBeforeStep:function(callback){this.before_step_callback=callback},onStep:function(callback){this.step_callback=callback},isMoving:function(){return!(this.path===null)},hasNextStep:function(){return this.path.length-1>this.step},hasChangedItsPath:function(){return!(this.newDestination===null)},isNear:function(character,distance){var dx,dy,near=false;dx=Math.abs(this.gridX-character.gridX);dy=Math.abs(this.gridY-character.gridY);if(dx<=distance&&dy<=distance){near=true}return near},onAggro:function(callback){this.aggro_callback=callback},onCheckAggro:function(callback){this.checkaggro_callback=callback},checkAggro:function(){if(this.checkaggro_callback){this.checkaggro_callback()}},aggro:function(character){if(this.aggro_callback){this.aggro_callback(character)}},onDeath:function(callback){this.death_callback=callback},lookAtTarget:function(){if(this.target){this.turnTo(this.getOrientationTo(this.target))}},go:function(x,y){if(this.isAttacking()){this.disengage()}else if(this.followingMode){this.followingMode=false;this.target=null}this.moveTo_(x,y)},follow:function(entity){if(entity){this.followingMode=true;this.moveTo_(entity.gridX,entity.gridY)}},stop:function(){if(this.isMoving()){this.interrupted=true}},engage:function(character){this.attackingMode=true;this.setTarget(character);this.follow(character)},disengage:function(){this.attackingMode=false;this.followingMode=false;this.removeTarget()},isAttacking:function(){return this.attackingMode},getOrientationTo:function(character){if(this.gridX<character.gridX){return Types.Orientations.RIGHT}else if(this.gridX>character.gridX){return Types.Orientations.LEFT}else if(this.gridY>character.gridY){return Types.Orientations.UP}else{return Types.Orientations.DOWN}},isAttackedBy:function(character){return character.id in this.attackers},addAttacker:function(character){if(!this.isAttackedBy(character)){this.attackers[character.id]=character}else{log.error(this.id+" is already attacked by "+character.id)}},removeAttacker:function(character){if(this.isAttackedBy(character)){delete this.attackers[character.id]}else{log.error(this.id+" is not attacked by "+character.id)}},forEachAttacker:function(callback){_.each(this.attackers,function(attacker){callback(attacker)})},setTarget:function(character){if(this.target!==character){if(this.hasTarget()){this.removeTarget()}this.unconfirmedTarget=null;this.target=character;if(this.settarget_callback){var targetName=Types.getKindAsString(character.kind);this.settarget_callback(character,targetName)}}else{log.debug(character.id+" is already the target of "+this.id)}},onSetTarget:function(callback){this.settarget_callback=callback},showTarget:function(character){if(this.inspecting!==character){this.inspecting=character;if(this.settarget_callback){var targetName=Types.getKindAsString(character.kind);this.settarget_callback(character,targetName,true)}}},removeTarget:function(){var self=this;if(this.target){if(this.target instanceof Character){this.target.removeAttacker(this)}if(this.removetarget_callback)this.removetarget_callback(this.target.id);this.target=null}},onRemoveTarget:function(callback){this.removetarget_callback=callback},hasTarget:function(){return!(this.target===null)},waitToAttack:function(character){this.unconfirmedTarget=character},isWaitingToAttack:function(character){return this.unconfirmedTarget===character},canAttack:function(time){if(this.canReachTarget()&&this.attackCooldown.isOver(time)){return true}return false},canReachTarget:function(){if(this.hasTarget()&&this.isAdjacentNonDiagonal(this.target)){return true}return false},die:function(){this.removeTarget();this.isDead=true;if(this.death_callback){this.death_callback()}},onHasMoved:function(callback){this.hasmoved_callback=callback},hasMoved:function(){this.setDirty();if(this.hasmoved_callback){this.hasmoved_callback(this)}},hurt:function(){var self=this;this.stopHurting();this.sprite=this.hurtSprite;this.hurting=setTimeout(this.stopHurting.bind(this),75)},stopHurting:function(){this.sprite=this.normalSprite;clearTimeout(this.hurting)},setAttackRate:function(rate){this.attackCooldown=new Timer(rate)}});return Character});