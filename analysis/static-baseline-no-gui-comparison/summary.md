# Static Image Variant Comparison: Model-Level Summary

This analysis compares the **original OpenGuessr static images** with the **no-location-GUI static image variant** while keeping the baseline inference settings unchanged.

## GeoCLIP

GeoCLIP shows the strongest improvement in mean error, decreasing from **1183 km to 437 km**. The effect is mainly driven by several very large original errors disappearing, although the median error also improves. This suggests that GeoCLIP is relatively sensitive to changes in the global image representation and can make large geographic jumps when the image appearance changes.

## SALAD

SALAD improves more moderately, from **1308 km to 1185 km** mean error. Its results are comparatively stable across the two image variants. This is consistent with its local-feature retrieval approach, where many patch-level features are aggregated into a single place descriptor and uninformative regions can have less influence.

## PLONK

PLONK's mean error decreases from **502 km to 364 km**, but only **7 of 25 locations improve**, while 18 become worse. The lower mean is therefore mainly caused by a few catastrophic errors becoming much smaller. This fits PLONK's generative approach, where a relatively small change in visual evidence can shift the sampled prediction toward a different geographic mode.

## Chipoint v2

Chipoint v2 shows the opposite pattern: mean error increases from **536 km to 875 km**, while the median changes much less and several locations still improve. Its multi-tower retrieval and geographic cluster-consensus pipeline can remain stable for many images, but changed candidate rankings can occasionally switch the selected geographic cluster and produce very large errors.

## Overall

The no-location-GUI image variant does **not** produce a consistent improvement across all static baselines. Instead, each architecture reacts differently to the change in image presentation. GeoCLIP benefits most clearly, SALAD is comparatively stable, PLONK improves mainly through fewer extreme failures, and Chipoint v2 becomes more vulnerable to a small number of large geographic errors.

None of the paired model-level differences is statistically significant after Holm correction on the 25-location benchmark, so these results should be interpreted as **model-specific sensitivity patterns rather than definitive causal effects of GUI removal**.
