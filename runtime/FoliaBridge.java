package dev.pastasrevenge.runtime;

import java.lang.reflect.Method;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.block.BlockFace;
import org.bukkit.block.data.BlockData;
import org.bukkit.entity.Entity;
import org.bukkit.inventory.ItemStack;
import org.bukkit.plugin.Plugin;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitScheduler;
import org.bukkit.scheduler.BukkitTask;

/** Injected compatibility bridge. Calls Folia APIs reflectively and falls back on Paper/Bukkit. */
public final class FoliaBridge {
    private FoliaBridge() {}

    public static BukkitTask runTask(BukkitScheduler s, Plugin p, Runnable r) { return global(p,"run",r,0,0) ? null : s.runTask(p,r); }
    public static BukkitTask runTaskLater(BukkitScheduler s, Plugin p, Runnable r, long d) { return global(p,"runDelayed",r,d,0) ? null : s.runTaskLater(p,r,d); }
    public static BukkitTask runTaskTimer(BukkitScheduler s, Plugin p, Runnable r, long d, long q) { return global(p,"runAtFixedRate",r,d,q) ? null : s.runTaskTimer(p,r,d,q); }
    public static BukkitTask runTaskAsynchronously(BukkitScheduler s, Plugin p, Runnable r) { return async(p,"runNow",r,0,0) ? null : s.runTaskAsynchronously(p,r); }
    public static BukkitTask runTaskLaterAsynchronously(BukkitScheduler s, Plugin p, Runnable r, long d) { return async(p,"runDelayed",r,d,0) ? null : s.runTaskLaterAsynchronously(p,r,d); }
    public static BukkitTask runTaskTimerAsynchronously(BukkitScheduler s, Plugin p, Runnable r, long d, long q) { return async(p,"runAtFixedRate",r,d,q) ? null : s.runTaskTimerAsynchronously(p,r,d,q); }

    public static int scheduleSyncDelayedTask(BukkitScheduler s, Plugin p, Runnable r) { return global(p,"run",r,0,0) ? -1 : s.scheduleSyncDelayedTask(p,r); }
    public static int scheduleSyncDelayedTask(BukkitScheduler s, Plugin p, Runnable r, long d) { return global(p,"runDelayed",r,d,0) ? -1 : s.scheduleSyncDelayedTask(p,r,d); }
    public static int scheduleSyncRepeatingTask(BukkitScheduler s, Plugin p, Runnable r, long d, long q) { return global(p,"runAtFixedRate",r,d,q) ? -1 : s.scheduleSyncRepeatingTask(p,r,d,q); }
    public static int scheduleAsyncDelayedTask(BukkitScheduler s, Plugin p, Runnable r) { return async(p,"runNow",r,0,0) ? -1 : s.scheduleAsyncDelayedTask(p,r); }
    public static int scheduleAsyncDelayedTask(BukkitScheduler s, Plugin p, Runnable r, long d) { return async(p,"runDelayed",r,d,0) ? -1 : s.scheduleAsyncDelayedTask(p,r,d); }
    public static int scheduleAsyncRepeatingTask(BukkitScheduler s, Plugin p, Runnable r, long d, long q) { return async(p,"runAtFixedRate",r,d,q) ? -1 : s.scheduleAsyncRepeatingTask(p,r,d,q); }

    public static BukkitTask runnableRunTask(BukkitRunnable r, Plugin p) { return global(p,"run",r,0,0) ? null : r.runTask(p); }
    public static BukkitTask runnableRunTaskLater(BukkitRunnable r, Plugin p, long d) { return global(p,"runDelayed",r,d,0) ? null : r.runTaskLater(p,d); }
    public static BukkitTask runnableRunTaskTimer(BukkitRunnable r, Plugin p, long d, long q) { return global(p,"runAtFixedRate",r,d,q) ? null : r.runTaskTimer(p,d,q); }
    public static BukkitTask runnableRunTaskAsynchronously(BukkitRunnable r, Plugin p) { return async(p,"runNow",r,0,0) ? null : r.runTaskAsynchronously(p); }
    public static BukkitTask runnableRunTaskLaterAsynchronously(BukkitRunnable r, Plugin p, long d) { return async(p,"runDelayed",r,d,0) ? null : r.runTaskLaterAsynchronously(p,d); }
    public static BukkitTask runnableRunTaskTimerAsynchronously(BukkitRunnable r, Plugin p, long d, long q) { return async(p,"runAtFixedRate",r,d,q) ? null : r.runTaskTimerAsynchronously(p,d,q); }

    public static boolean entityTeleport(Entity e, Location l) {
        try { invoke(e,"teleportAsync",l); return true; }
        catch (RuntimeException unavailable) { return e.teleport(l); }
    }

    public static void blockSetType(Block b, Material m) { region(b,() -> b.setType(m)); }
    public static void blockSetTypePhysics(Block b, Material m, boolean physics) { region(b,() -> b.setType(m,physics)); }
    public static void blockSetBlockData(Block b, BlockData d) { region(b,() -> b.setBlockData(d)); }
    public static void blockSetBlockDataPhysics(Block b, BlockData d, boolean physics) { region(b,() -> b.setBlockData(d,physics)); }
    public static boolean blockBreakNaturally(Block b) { region(b,b::breakNaturally); return true; }
    public static boolean blockBreakNaturallyWithTool(Block b, ItemStack i) { region(b,() -> b.breakNaturally(i)); return true; }
    public static boolean blockApplyBoneMeal(Block b, BlockFace f) { region(b,() -> b.applyBoneMeal(f)); return true; }

    private static boolean global(Plugin p, String method, Runnable task, long delay, long period) {
        try {
            Object scheduler=invoke(p.getServer(),"getGlobalRegionScheduler"); Consumer<Object> c=x->task.run();
            if ("run".equals(method)) invoke(scheduler,method,p,c);
            else if ("runDelayed".equals(method)) invoke(scheduler,method,p,c,delay);
            else invoke(scheduler,method,p,c,delay,period);
            return true;
        } catch (RuntimeException ignored) { return false; }
    }
    private static boolean async(Plugin p, String method, Runnable task, long delayTicks, long periodTicks) {
        try {
            Object scheduler=invoke(p.getServer(),"getAsyncScheduler"); Consumer<Object> c=x->task.run();
            if ("runNow".equals(method)) invoke(scheduler,method,p,c);
            else if ("runDelayed".equals(method)) invoke(scheduler,method,p,c,Math.max(0,delayTicks*50),TimeUnit.MILLISECONDS);
            else invoke(scheduler,method,p,c,Math.max(0,delayTicks*50),Math.max(1,periodTicks*50),TimeUnit.MILLISECONDS);
            return true;
        } catch (RuntimeException ignored) { return false; }
    }
    private static void region(Block b, Runnable task) {
        try {
            Class<?> bukkit=Class.forName("org.bukkit.Bukkit"); Object server=invokeStatic(bukkit,"getServer"); Object scheduler=invoke(server,"getRegionScheduler"); Consumer<Object> c=x->task.run(); invoke(scheduler,"run",nullPlugin(),b.getLocation(),c);
        } catch (RuntimeException | ClassNotFoundException unavailable) { task.run(); }
    }
    private static Plugin nullPlugin() {
        try {
            Class<?> bukkit=Class.forName("org.bukkit.Bukkit");
            Object pm=invokeStatic(bukkit,"getPluginManager");
            Object[] plugins=(Object[])invoke(pm,"getPlugins");
            ClassLoader ours=FoliaBridge.class.getClassLoader();
            for(Object candidate:plugins) if(candidate instanceof Plugin plugin && plugin.getClass().getClassLoader()==ours) return plugin;
            return null;
        } catch (Exception e) { return null; }
    }
    private static Object invokeStatic(Class<?> type,String name,Object...args){return invoke0(null,type,name,args);}
    private static Object invoke(Object target,String name,Object...args){return invoke0(target,target.getClass(),name,args);}
    private static Object invoke0(Object target,Class<?> type,String name,Object...args){
        for(Method m:type.getMethods()) if(m.getName().equals(name)&&compatible(m.getParameterTypes(),args)) try{return m.invoke(target,args);}catch(Exception e){throw new IllegalStateException(e);}
        throw new IllegalStateException("Missing method: "+type.getName()+"#"+name);
    }
    private static boolean compatible(Class<?>[] p,Object[] a){if(p.length!=a.length)return false;for(int i=0;i<p.length;i++)if(a[i]!=null&&!wrap(p[i]).isInstance(a[i]))return false;return true;}
    private static Class<?> wrap(Class<?> c){if(!c.isPrimitive())return c;if(c==long.class)return Long.class;if(c==int.class)return Integer.class;if(c==boolean.class)return Boolean.class;if(c==double.class)return Double.class;if(c==float.class)return Float.class;if(c==short.class)return Short.class;if(c==byte.class)return Byte.class;if(c==char.class)return Character.class;return Void.class;}
}
